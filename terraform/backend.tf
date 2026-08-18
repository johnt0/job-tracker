resource "aws_security_group" "backend" {
  name = "backend-sg"
  description = "Allow CloudFront + SSH to backend"

  ingress {
    from_port = 8000
    to_port = 8000
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
      from_port = 22
      to_port = 22
      protocol = "tcp"
      cidr_blocks = [var.my_ip]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "backend_ec2" {
  name = "backend-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {Service = "ec2.amazonaws.com"}
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backend_ecr_readonly" {
  role = aws_iam_role.backend_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "backend" {
  name = "backend-ec2-profile"
  role = aws_iam_role.backend_ec2.name
}

resource "aws_iam_role_policy" "ssm_read" {
  name = "ssm-read-secrets"
  role = aws_iam_role.backend_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ssm:GetParameter"
        Resource = "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/backend/*"
      },
      {
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = "*"
      }
    ]
  })
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners = ["amazon"]

  filter {
    name = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_key_pair" "backend" {
  key_name   = "backend-key"
  public_key = file("~/.ssh/id_ed25519.pub")
}

resource "aws_instance" "backend" {
  ami = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile = aws_iam_instance_profile.backend.name
  availability_zone = aws_ebs_volume.backend_data.availability_zone
  key_name = aws_key_pair.backend.key_name

  user_data_replace_on_change = true

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    ecr_repository_url = aws_ecr_repository.backend.repository_url
    cloudfront_domain  = var.cloudfront_domain
  })

  tags = {
    Name = "backend"
  }
}

resource "aws_ebs_volume" "backend_data" {
  availability_zone = "us-east-1a"
  size              = 5
  type              = "gp3"

  tags = {
    Name = "backend-data"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_volume_attachment" "backend_data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.backend_data.id
  instance_id = aws_instance.backend.id
}

output "backend_public_ip" {
  value = aws_instance.backend.public_ip
}
