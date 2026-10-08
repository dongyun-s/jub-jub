# AWS backend deployment

This deployment runs Spring Boot and FastAPI on one EC2 instance, uses RDS
MySQL, and stores uploaded images in a private S3 bucket. CloudFront reads the
images through Origin Access Control (OAC).

## Resources

- Region: `ap-southeast-2`
- S3 bucket: `jubjub-images-prod-294427323709-ap-southeast-2-an`
- Image CloudFront domain: `d3g5nlpx9221c8.cloudfront.net`
- EC2: `jubjub-prod-ec2` (`t3.micro`, Docker Compose)
- EC2 security group: `jubjub-ec2-sg` (`sg-0ba37b3e4bb37e62f`)
- RDS: `jubjub-prod-db` (MySQL 8.4, private, single AZ)
- RDS endpoint: `jubjub-prod-db.ch44uyu8acxi.ap-southeast-2.rds.amazonaws.com`
- EC2 instance role: `jubjub-ec2-app-role`

## EC2 instance role

Attach an IAM role to EC2 instead of storing AWS access keys in an environment
file. The application uses the AWS SDK default credential chain and receives
temporary credentials from the instance role.

Use a least-privilege policy for presigned uploads:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowJubJubImageUploads",
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::jubjub-images-prod-294427323709-ap-southeast-2-an/*"
    }
  ]
}
```

Keep S3 Block Public Access enabled. Grant read access only to the CloudFront
distribution through its OAC bucket policy.

For containers to retrieve instance-role credentials, allow IMDSv2 on the EC2
instance and set the metadata response hop limit to `2`.

## RDS connectivity

- Place EC2 and RDS in the same VPC.
- Allow inbound MySQL `3306` on the RDS security group only from the EC2
  security group.
- Do not expose RDS publicly.
- Put the RDS endpoint and credentials in `.env.production` on EC2.

## Environment file

Create `.env.production` on EC2 from `.env.production.example` and replace all
placeholders. Never commit `.env.production`.

The image URL uses the private-bucket CloudFront distribution:

```dotenv
AWS_S3_PUBLIC_BASE_URL=https://d3g5nlpx9221c8.cloudfront.net
```

Set `CORS_ALLOWED_ORIGINS` to the HTTPS domain of the frontend CloudFront
distribution. Do not use `*` with credentialed browser requests.

Do not add `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` to the production
environment.

## Run

The backend port is bound to EC2 loopback so that a host reverse proxy can
terminate HTTPS without exposing port `8080` publicly.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Install the checked-in Nginx site and verify it before reloading:

```bash
sudo cp deploy/nginx/jubjub.conf /etc/nginx/sites-available/jubjub
sudo ln -sfn /etc/nginx/sites-available/jubjub /etc/nginx/sites-enabled/jubjub
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The EC2 security group exposes only HTTP/HTTPS. Administrative access uses
Systems Manager Session Manager, so inbound SSH is not enabled. Configure a
domain and TLS certificate before connecting the HTTPS frontend to the API.

## Verification

1. `curl http://127.0.0.1:8080/actuator/health` returns `UP` on EC2.
2. The API creates a presigned upload URL without static AWS keys.
3. A browser can upload an allowed image type to the presigned URL.
4. The resulting public URL uses CloudFront and loads successfully.
5. Direct public S3 object access remains blocked.
