locals {
  name_prefix = "${var.project_name}-${var.environment}"
  origin_id = "S3-${aws_s3_bucket.frontend.id}"
}

data "aws_caller_identity" "current" {}
