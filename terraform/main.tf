# s3 bucket for static website hosting
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend"
}

# makes s3 private
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# origin access for cloudfront (recommended over OAI)
resource "aws_cloudfront_origin_access_control" "frontend" {
  name = "frontend-oac"
  description = "frontend policy"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

resource "aws_s3_bucket_policy" "allow_access_from_another_account" {
  bucket = aws_s3_bucket.frontend.id
  depends_on = [ aws_s3_bucket_public_access_block.frontend ]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
    Action    = "s3:GetObject"
    Resource  = "${aws_s3_bucket.frontend.arn}/*"
    Condition = {
      StringEquals = {
        "AWS:SourceArn" = aws_cloudfront_distribution.s3_distribution.arn
      }
    }
    }]
  })
}

resource "aws_s3_object" "frontend_files" {
  for_each = fileset("../frontend/dist", "**/*")
  bucket = aws_s3_bucket.frontend.id
  key    = each.value
  source = "../frontend/dist/${each.value}"
  etag = filemd5("../frontend/dist/${each.value}")
  content_type = lookup({
    "html" = "text/html",
    "css"  = "text/css",
    "js"   = "application/javascript",
    "json" = "application/json",
    "png"  = "image/png",
    "jpg"  = "image/jpeg",
    "jpeg" = "image/jpeg",
    "gif"  = "image/gif",
    "svg"  = "image/svg+xml",
    "ico"  = "image/x-icon",
    "txt"  = "text/plain"
  }, split(".", each.value)[length(split(".", each.value)) - 1], "application/octet-stream")
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = local.origin_id
  }

  origin {
    domain_name = aws_instance.backend.public_dns
    origin_id = "backend"

    custom_origin_config {
      http_port = 8000
      https_port = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Some comment"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "backend"

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/admin/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "backend"

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "GB", "DE"]
    }
  }

  tags = {
    Environment = "production"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_ecr_repository" "backend" {
  name = "backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

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

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners = ["amazon"]

  filter {
    name = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "backend" {
  ami = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile = aws_iam_instance_profile.backend.name

  user_data_replace_on_change = true

 user_data = <<-EOF
  #!/bin/bash
  set -euxo pipefail

  dnf install -y docker
  systemctl start docker
  systemctl enable docker

  TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
  PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

  SECRET=$(aws ssm get-parameter --name "/backend/django-secret-key" --with-decryption --region us-east-1 --query Parameter.Value --output text)

  aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}
  docker run -d -p 8000:8000 --restart unless-stopped \
    -e DJANGO_SECRET_KEY="$SECRET" \
    -e DJANGO_ALLOWED_HOSTS="$PUBLIC_IP,${var.cloudfront_domain},localhost,127.0.0.1" \
    -e DJANGO_CSRF_TRUSTED_ORIGINS="https://${var.cloudfront_domain}" \
    ${aws_ecr_repository.backend.repository_url}:latest
  EOF

  tags = {
    Name = "backend"
  }
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
