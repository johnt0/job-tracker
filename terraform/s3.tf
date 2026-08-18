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
