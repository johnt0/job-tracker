variable "project_name" {
  description = "short name used to prefix/tag every resource"
  type = string
  default = "job-tracker"
}

variable "environment" {
  type = string
  default = "prod"
}

variable "my_ip" {
  description = "Your IP for SSH access"
  type = string
}

variable "cloudfront_domain" {
  description = "CloudFront distribution domain. Hardcoded to break the dependency cycle: the distribution's origin already references aws_instance.backend.public_dns, so user_data cannot reference the distribution back."
  type        = string
  default     = "d39a0cxejbhfky.cloudfront.net"
}
