#!/bin/bash
set -euxo pipefail

dnf install -y docker
systemctl start docker
systemctl enable docker

if ! blkid /dev/xvdf; then
  mkfs -t ext4 /dev/xvdf
fi
mkdir -p /mnt/data
mount /dev/xvdf /mnt/data
echo "/dev/xvdf /mnt/data ext4 defaults,nofail 0 2" >> /etc/fstab
chmod 777 /mnt/data

TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

SECRET=$(aws ssm get-parameter --name "/backend/django-secret-key" --with-decryption --region us-east-1 --query Parameter.Value --output text)

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ecr_repository_url}

docker run --rm \
  -v /mnt/data:/app/data \
  -e DJANGO_SECRET_KEY="$SECRET" \
  -e DATABASE_URL="sqlite:////app/data/db.sqlite3" \
  ${ecr_repository_url}:latest \
  python manage.py migrate --noinput

docker run -d -p 8000:8000 --restart unless-stopped \
  -v /mnt/data:/app/data \
  -e DJANGO_SECRET_KEY="$SECRET" \
  -e DATABASE_URL="sqlite:////app/data/db.sqlite3" \
  -e DJANGO_ALLOWED_HOSTS="$PUBLIC_IP,${cloudfront_domain},localhost,127.0.0.1" \
  -e DJANGO_CSRF_TRUSTED_ORIGINS="https://${cloudfront_domain}" \
  ${ecr_repository_url}:latest
