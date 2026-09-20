# Cloud Computing Architecture & Services

## Summary
Cloud platforms (AWS, Azure, Google Cloud) provide on-demand compute, managed relational and NoSQL databases, object storage, and serverless runtimes.

## Key Concepts
- **Cloud Service Models**: IaaS (Virtual machines, raw networking), PaaS (App services, managed databases), SaaS, and Serverless (FaaS, ephemeral event execution).
- **Identity & Access Management (IAM)**: Principle of Least Privilege, Roles vs Users vs Policies, Temporary STS credentials, and service accounts.
- **Networking & Isolation**: Virtual Private Clouds (VPC), Public vs Private Subnets, NAT Gateways, Internet Gateways, and Security Groups vs Network ACLs.
- **Reliability & Multi-Region**: Availability Zones (isolated datacenters within a region), Regions, Cross-region replication, and Disaster Recovery (RTO / RPO).

## Worked Example: AWS S3 Presigned URL Generation (Python)
```python
import boto3
from botocore.exceptions import ClientError

def generate_presigned_upload_url(bucket_name: str, object_name: str, expiration: int = 300) -> str | None:
    """Generate secure client-side upload link without exposing AWS credentials."""
    s3_client = boto3.client('s3')
    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': object_name},
            ExpiresIn=expiration
        )
        return url
    except ClientError:
        return None
```

## Common Interview Questions
1. *What is the difference between a Security Group and a Network ACL (NACL)?* (Security Groups are stateful firewalls operating at the instance level; NACLs are stateless firewalls operating at the subnet level).
2. *Explain RTO and RPO in Disaster Recovery planning.* (RTO = Recovery Time Objective: max acceptable downtime; RPO = Recovery Point Objective: max acceptable data loss measured in time).
3. *What is a Serverless 'Cold Start'?* (The initialization latency required when an idle function container must be provisioned, downloaded, and booted by the cloud provider before handling a request).

## Documentation & Official Resources
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Microsoft Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
