# Installation

## add ingress-nginx repo
```sh
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```

## install nginx ingress
```sh
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer
```

## install metrics-server (required for HPA)
```sh
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```
## or use helm chart for HA

## create K8S secrets
```sh
kubectl create secret generic db-secret \
  --from-literal=DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}:5432/appdb" \
  -n production
# Also create secrets or configmaps for S3 bucket name, SQS queue URL and AWS credentials if your pods will call AWS APIs directly.
# Prefer using IAM Roles for Service Accounts (IRSA) rather than embedding AWS creds — the EKS module can create an OIDC provider 
# & IAM role for service accounts (the module supports this). Using IRSA is strongly recommended for security.
```

```txt
After the ingress controller Service LoadBalancer gets an external IP/DNS, you can point your domain or test via that DNS.

(If you prefer AWS Load Balancer Controller (ALB), you'll need to deploy the AWS Load Balancer Controller and create 
an IAM OIDC provider for the cluster — this is more setup but recommended for production.)
```

## apply K8S manifests

```sh
# get kubeconfig (if using terraform output file)
terraform output -raw kubeconfig > kubeconfig
export KUBECONFIG=./kubeconfig

kubectl apply -f k8s-manifests/namespace.yaml
kubectl apply -f k8s-manifests/parser.deployment.yaml
kubectl apply -f k8s-manifests/parser.service.yaml
kubectl apply -f k8s-manifests/uploader.deployment.yaml
kubectl apply -f k8s-manifests/uploader.service.yaml
kubectl apply -f k8s-manifests/ingress.yaml
kubectl apply -f k8s-manifests/hpa-parser.yaml
kubectl apply -f k8s-manifests/hpa-uploader.yaml
```
