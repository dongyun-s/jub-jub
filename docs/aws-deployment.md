# AWS 백엔드 배포

이 문서는 Spring Boot 백엔드와 FastAPI 서비스를 AWS에 배포할 때 필요한 구성과 점검 절차를 설명합니다. 운영 환경의 실제 계정 번호, 리소스 ID, 엔드포인트와 도메인은 이 문서에 기록하지 않습니다. 아래의 `YOUR_...` 값은 배포 전에 실제 값으로 교체하는 자리표시자입니다.

## 구성 개요

- Spring Boot와 FastAPI는 EC2에서 Docker Compose로 실행합니다.
- Spring Boot는 비공개 네트워크의 RDS MySQL에 연결합니다.
- 업로드 파일은 비공개 S3 버킷에 저장합니다.
- 브라우저는 백엔드가 발급한 사전 서명 URL로 S3에 업로드하고, 이미지는 CloudFront의 Origin Access Control(OAC)을 통해 읽습니다.
- 외부 HTTPS 요청은 EC2의 Nginx가 받고, 백엔드 컨테이너로 전달합니다.

요청 흐름은 다음과 같습니다.

```text
브라우저 → HTTPS 도메인 → Nginx → Spring Boot → FastAPI
브라우저 → 사전 서명 URL → 비공개 S3 → CloudFront(OAC) → 브라우저
Spring Boot → 비공개 RDS MySQL
```

## 배포 전 준비

다음 리소스를 준비하고 실제 값을 안전한 운영 기록에 보관합니다.

- AWS 리전: `YOUR_AWS_REGION`
- EC2 인스턴스와 인스턴스 프로파일: `YOUR_EC2_INSTANCE_ROLE`
- EC2 보안 그룹: `YOUR_EC2_SECURITY_GROUP`
- 비공개 S3 버킷: `YOUR_S3_BUCKET_NAME`
- CloudFront 배포 도메인: `YOUR_CLOUDFRONT_DOMAIN`
- 비공개 RDS MySQL 엔드포인트: `YOUR_RDS_ENDPOINT`
- 프런트엔드 HTTPS 도메인: `YOUR_FRONTEND_DOMAIN`

실제 운영 도메인, 계정 번호, 보안 그룹 ID와 데이터베이스 주소는 공개 저장소에 커밋하지 않습니다.

## 네트워크 구성

- EC2와 RDS를 같은 VPC에 배치합니다.
- RDS는 비공개 서브넷에 두고 퍼블릭 액세스를 비활성화합니다.
- RDS 보안 그룹의 MySQL 인바운드 포트 `3306`은 EC2 보안 그룹에서 오는 트래픽만 허용합니다.
- EC2 보안 그룹은 필요한 웹 트래픽만 허용합니다. HTTP에서 HTTPS로 리다이렉트하는 경우 HTTP `80`과 HTTPS `443`을 사용합니다.
- 운영 서버의 SSH 포트 `22`를 인터넷에 열지 않습니다. 관리 접속에는 AWS Systems Manager Session Manager를 사용합니다.
- 백엔드 포트 `8080`은 EC2 루프백 주소에만 바인딩하고 외부에 직접 공개하지 않습니다.

도메인에서 API를 사용하기 전에 DNS와 TLS 인증서를 구성합니다. 인증서가 적용된 뒤 프런트엔드의 API 주소와 백엔드 CORS 허용 도메인이 일치하는지 확인합니다.

## EC2 IAM 역할과 S3

장기 AWS 액세스 키를 환경 파일에 저장하지 말고 EC2에 IAM 역할을 연결합니다. 애플리케이션은 AWS SDK 기본 자격 증명 체인을 사용해 인스턴스 역할에서 임시 자격 증명을 받습니다.

사전 서명 업로드를 위한 역할 정책은 업로드 대상 버킷과 경로에만 `s3:PutObject`를 허용하도록 제한합니다. 아래 버킷 이름을 실제 값으로 교체합니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowImageUploads",
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::YOUR_S3_BUCKET_NAME/*"
    }
  ]
}
```

버킷의 S3 Block Public Access를 계속 활성화합니다. CloudFront 읽기 권한은 해당 배포의 OAC만 허용하는 S3 버킷 정책으로 설정합니다. 버킷을 퍼블릭으로 열거나 애플리케이션 역할에 불필요한 `s3:*` 권한을 주지 않습니다.

컨테이너에서 인스턴스 역할 자격 증명을 사용하려면 EC2에서 IMDSv2를 활성화하고 메타데이터 응답 홉 제한을 `2`로 설정합니다.

## 운영 환경 파일

EC2에서 저장소의 `.env.production.example`을 복사해 `.env.production`을 만들고 자리표시자를 실제 운영 값으로 교체합니다. 운영 환경 파일에는 데이터베이스 암호, JWT 비밀값, 외부 API 키 등이 들어가므로 저장소에 추가하거나 로그와 화면 공유에 노출하지 않습니다.

주요 배포 값은 다음과 같습니다.

```dotenv
SPRING_DATASOURCE_URL=jdbc:mysql://YOUR_RDS_ENDPOINT:3306/jubjub?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
AWS_REGION=YOUR_AWS_REGION
AWS_S3_BUCKET=YOUR_S3_BUCKET_NAME
AWS_S3_PUBLIC_BASE_URL=https://YOUR_CLOUDFRONT_DOMAIN
CORS_ALLOWED_ORIGINS=https://YOUR_FRONTEND_DOMAIN
```

`CORS_ALLOWED_ORIGINS`에는 실제 프런트엔드 HTTPS 도메인을 지정합니다. 인증 정보를 포함한 브라우저 요청에는 `*`를 사용하지 않습니다. AWS SDK는 EC2 인스턴스 역할의 임시 자격 증명을 사용하므로 `AWS_ACCESS_KEY_ID`와 `AWS_SECRET_ACCESS_KEY`를 설정하지 않습니다.

## 배포 및 실행

EC2에서 저장소를 준비한 뒤 프로덕션 Compose 설정을 확인하고 서비스를 시작합니다.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

`docker compose config` 출력에는 환경 변수의 실제 값이 포함될 수 있습니다. 출력 결과를 공개 이슈나 로그에 붙여넣지 않습니다.

저장소에 포함된 Nginx 사이트 설정을 설치하고 설정 검사를 통과한 뒤 Nginx를 다시 불러옵니다.

```bash
sudo cp deploy/nginx/jubjub.conf /etc/nginx/sites-available/jubjub
sudo ln -sfn /etc/nginx/sites-available/jubjub /etc/nginx/sites-enabled/jubjub
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 배포 확인

1. EC2에서 `curl http://127.0.0.1:8080/actuator/health`를 실행해 `UP` 응답을 확인합니다.
2. 브라우저에서 허용된 이미지 형식으로 업로드를 요청하고, API가 사전 서명 URL을 발급하는지 확인합니다.
3. 사전 서명 URL을 사용한 업로드가 성공하는지 확인합니다.
4. 업로드된 이미지 URL이 CloudFront 도메인을 사용하고 브라우저에서 정상적으로 열리는지 확인합니다.
5. S3 객체 URL로 직접 퍼블릭 접근이 차단되는지 확인합니다.
6. EC2에서 RDS로 연결되는지 확인하고, 인터넷에서 RDS에 직접 접근할 수 없는지 확인합니다.
7. 운영 환경 파일이나 로그에 AWS 장기 액세스 키가 없는지 확인합니다.

## 문제 발생 시 증상별 점검 방법

- RDS 연결 실패: RDS가 비공개인지, EC2와 RDS가 같은 VPC에 있는지, RDS 보안 그룹이 EC2 보안 그룹에서 오는 `3306`만 허용하는지 확인합니다.
- S3 업로드 URL 발급 실패: EC2 인스턴스에 올바른 IAM 역할이 연결됐는지, 역할 정책의 버킷 ARN과 실제 버킷이 일치하는지 확인합니다.
- 업로드 후 이미지 접근 실패: S3 Block Public Access를 끄지 말고, CloudFront OAC와 버킷 정책의 배포 연결 및 도메인 설정을 확인합니다.
- API 헬스 체크 실패: `docker compose ... ps`와 백엔드 로그를 확인하고, 데이터베이스 주소 및 필수 환경 변수가 올바른지 점검합니다.
