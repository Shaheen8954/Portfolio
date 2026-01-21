---
lang: en
title: "Self-Hosting Gitea on Kubernetes: A Practical DevOps PoC"
description: "A comprehensive introduction to Kubernetes, its components, and core concepts for beginners"
pubDate: 2026-01-21
updatedDate: 2026-01-21
heroImage:
  url: "/images/blog/gitea.png"
  alt: "Gitea Setup"
tags:
  - "homelab"
  - "kubernetes"
  - "microk8s"
  - "cloudflare"
relatedPosts: []
isDraft: false 
---

## Introduction
When learning Kubernetes, it is easy to deploy applications using Helm charts or copy existing manifests. While this works, it often hides why certain resources exist and how applications actually behave in a real cluster.
To strengthen my fundamentals, I built a Proof of Concept (PoC) where I manually deployed Gitea on Kubernetes, without Helm, focusing on understanding each component, debugging real issues, and applying production-style practices.
This blog documents that journey.

### Why Gitea?
Gitea is a lightweight, self-hosted Git service. It is simple enough for a homelab but realistic enough to represent real production workloads.
It was a good choice because:
- It requires persistent storage
- It uses a database backend
- It supports real Git operations (clone, push, pull)
- It can be exposed securely over HTTPS


### High-Level Architecture
The PoC consists of the following components:
- Kubernetes as the orchestration platform
- Gitea running as a Deployment
- PostgreSQL as the database backend
- PersistentVolumeClaims (PVCs) for data persistence
- Cloudflare Tunnel for secure external access
- Cloudflare Access for identity-based protection

### Request Flow
User / Git Client
        ↓
Cloudflare (HTTPS + Access)
        ↓
Cloudflare Tunnel
        ↓
Kubernetes Service
        ↓
Gitea Pod
   ├── Persistent Volume (/data)
   └── PostgreSQL Service

This setup avoids exposing NodePorts or public IPs and works well even behind NAT.

### Deployment Approach

1. Understanding the Application First
Before writing any Kubernetes YAML, I inspected the Gitea container image to answer basic questions:

- Which ports does it expose?
- Does it need persistent storage?
- Does it require a database?
- Which paths must be writable?

This step helped avoid unnecessary resources and reduced trial-and-error.


### Prerequisites

- Kubernetes cluster (homelab / local cluster)
- kubectl configured
- StorageClass available for PVCs
- Cloudflare account + domain
- Cloudflare Tunnel already configured or accessible

## Deployment Steps (High Level)
1. #### Create PostgreSQL

  - Create Secret for database password
  - Create PVC for PostgreSQL
  - Create PostgreSQL Deployment
  - Create PostgreSQL Service


### Namespace

All resources are deployed in namespace:

- gitea

### 1.1. Create namespace

```
apiVersion: v1
kind: Namespace
metadata:
  name: gitea
```
``` 
kubectl apply -f namespace.yaml
 ```

#### 1.2. Create Secret
```
apiVersion: v1
kind: Secret
metadata:
  name: pg-secret
  namespace: gitea
type: Opaque
stringData:
  POSTGRES_PASSWORD: gitea123
```
#### 1.3. Create persistent volume claim for PostgreSQL
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pg-pvc
  namespace: gitea
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### 2. Database First: PostgreSQL
PostgreSQL was deployed before Gitea because the application cannot start without a database.

Key points:

- PostgreSQL runs as a Deployment
- Data is persisted using a PVC
- Credentials are stored in Kubernetes Secrets
- A ClusterIP Service enables internal connectivity

#### 2.4. Create PostgreSQL Deployment 
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: gitea
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: gitea
        - name: POSTGRES_USER
          value: gitea
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: pg-secret
              key: POSTGRES_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: pgdata
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: pgdata
        persistentVolumeClaim:
          claimName: pg-pvc
```
### Create postgres service

```
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: gitea
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

### 2.5. Deploy PostgreSQL
```
kubectl apply -f secret.yaml
kubectl apply -f pvc.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml
```
### Check PostgreSQL
```
kubens gitea
kubectl get pods
kubectl get svc
```
### 3. Deploying Gitea

Gitea was deployed with:
- A PVC mounted at /data for repositories and configuration
- Environment variables to connect to PostgreSQL
- A ClusterIP Service on port 3000

After initial startup, Gitea writes its configuration to the persistent volume, ensuring settings survive pod restarts.

### 4. Reliability Improvements

To make the deployment more production-like, I added the following:

#### Resource Requests and Limits

This ensures predictable scheduling and avoids resource contention:
- CPU and memory requests for baseline usage
- Limits to prevent runaway consumption

#### Health Probes

Three probes were configured, each with a specific purpose:
- ### Liveness Probe:
Ensures the container is healthy and restarts if unhealthy
- ### Readiness Probe:
Ensures the application is ready to receive traffic
- ### Startup Probe:
Ensures the application starts successfully
Uses a simple endpoint (/) to avoid premature failures during migrations.

Understanding the difference between these probes was one of the most valuable learnings in this PoC.

2. Create Gitea

#### Create PVC for /data
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: gitea-pvc
  namespace: gitea
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```
#### Create Gitea Deployment
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitea
  namespace: gitea
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gitea
  template:
    metadata:
      labels:
        app: gitea
    spec:
      containers:
      - name: gitea
        image: gitea/gitea:latest
        ports:
          - containerPort: 3000
        env:
          - name: GITEA__database__DB_TYPE
            value: postgres
          - name: GITEA__database__HOST
            value: postgres:5432
          - name: GITEA__database__NAME
            value: gitea
          - name: GITEA__database__USER
            value: gitea
          - name: GITEA__server__ROOT_URL
            value: "https://gitea.shaheen.homes/"
          - name: GITEA__database__PASSWD
            valueFrom:
              secretKeyRef:
                name: pg-secret
                key: POSTGRES_PASSWORD
        startupProbe:
          httpGet:
            path: /
            port: 3000
          failureThreshold: 30
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /api/healthz
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        livenessProbe:
          httpGet:
            path: /api/healthz
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 20
          timeoutSeconds: 5
          failureThreshold: 3

        volumeMounts:
          - name: gitea-data
            mountPath: /data
      volumes:
        - name: gitea-data
          persistentVolumeClaim:
            claimName: gitea-pvc
```
#### Create Gitea Service
```
apiVersion: v1
kind: Service
metadata:
  name: gitea
  namespace: gitea
spec:
  selector:
    app: gitea
  ports:
    - port: 3000
      targetPort: 3000
```
#### Deploy Gitea
```
kubectl apply -f gitea-pvc.yaml
kubectl apply -f gitea-deployment.yaml
kubectl apply -f gitea-service.yaml
```
#### Check Gitea
```
kubectl get pods 
kubectl get svc 
```
#### Check on localhost
```
kubectl port-forward svc/gitea 3000:3000
```
Access at ```http://localhost:3000 ```

#### Expose using Cloudflare Tunnel

##### Create a cloudflare tunnel

- Go to cloudflare dashboard and Click on Zero Trust
- Click on Networks
- Click on Connectors
- Click on create Tunnel and create a tunnel
- Click on your tunnel and click on Edit
- Add Hostname Routes
- Click on Published application routes
- Add Published application routes
- Add subdomain
- Add your domain
- Type http
- URL: gitea.gitea.svc.cluster.local:3000
- Click on Save

Access at domain:

-   ```https://gitea.shaheen.homes```

Now you can use gitea as a normal application, register a user and create a repository.

##### Persistence Validation

Persistence was verified by:

1. Creating repositories and pushing code
2. Deleting the Gitea pod
3. Allowing Kubernetes to recreate the pod
4. Confirming that repositories and configuration still existed

This validated that both the PVC and database design were correct.

## Keycloak SSO (Kubernetes Homelab) + Gitea Integration (OIDC)

This repository documents how to set up Keycloak for Single Sign-On (SSO) in a homelab Kubernetes environment and integrate Gitea using OpenID Connect (OIDC).
## Overview
### What is Keycloak?

Keycloak is an open-source Identity and Access Management (IAM) platform that provides:

- Single Sign-On (SSO)
- User/Group/Role management
- OAuth2 / OpenID Connect / SAML support
- MFA (OTP), policies, and session management

#### Why use Keycloak in a Homelab?

- Centralized authentication for self-hosted apps
- One login for multiple services
- Role-based access across applications
- Improved security and auditability

### Architecture (High Level)

1. User opens an application (e.g., Gitea)
2. Application redirects user to Keycloak
3. User authenticates in Keycloak
4. Keycloak redirects back to the application
5. Application logs in/creates the user account

### Prerequisites

- Kubernetes cluster
- Domain + HTTPS access to applications
- Keycloak reachable externally (Ingress/Reverse proxy/Cloudflare Tunnel)
- Gitea reachable externally
- Admin access to Keycloak and Gitea


### Keycloak self-hosted setup

### Namespace Creation
```
kubectl create namespace keycloak
```
### Secrets
```
apiVersion: v1
kind: Secret
metadata:
  name: pg-secret
  namespace: keycloak
type: Opaque
stringData:
  POSTGRES_PASSWORD: password

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: keycloak-config
  namespace: keycloak
data:
  keycloak.json: |
```
### Persistent Volume Claim

```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: keycloak
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```
### Postgres Deployment & Service
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          env:
            - name: POSTGRES_DB
              value: keycloak
            - name: POSTGRES_USER
              value: keycloak
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: pg-secret
                  key: POSTGRES_PASSWORD
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
      volumes:
      - name: pgdata
        persistentVolumeClaim:
          claimName: postgres-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: keycloak
spec:
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
```
### 2.5. Deploy PostgreSQL
```
kubectl apply -f secret.yaml
kubectl apply -f pvc.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml
```
### Check PostgreSQL
```
kubens keycloak
kubectl get pods
kubectl get svc
```
### Create Keycloak Deployment & Service
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
        - name: keycloak
          image: quay.io/keycloak/keycloak:22.0.1
          ports:
            - containerPort: 8080
          args:
            - start
          env:
            - name: KEYCLOAK_ADMIN
              value: admin
            - name: KEYCLOAK_ADMIN_PASSWORD
              value: admin
            # - name: KEYCLOAK_IMPORT
            #   value: /opt/jboss/keycloak/standalone/configuration/keycloak.json
            - name: KC_PROXY
              value: "edge"
            - name: KC_HOSTNAME
              value: "keycloak.shaheen.homes"
            - name: KC_HOSTNAME_STRICT
              value: "false"
            - name: KC_HTTP_ENABLED
              value: "true"
            - name: KC_HOSTNAME_STRICT_HTTPS
              value: "false"
            # Enable health endpoints
            - name: KC_HEALTH_ENABLED
              value: "true"
            # Database Configuration (Connect to Postgres)
            - name: KC_DB
              value: postgres
            - name: KC_DB_URL
              value: "jdbc:postgresql://postgres.keycloak.svc.cluster.local:5432/keycloak"
            - name: KC_DB_USERNAME
              value: "keycloak"
            - name: KC_DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: pg-secret
                  key: POSTGRES_PASSWORD

          #  Startup Probe (gives time for Keycloak to fully start)
          startupProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 30   # 30x10=300 seconds (5 minutes)

          #  Readiness Probe (pod gets traffic only after ready)
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          #  Liveness Probe (restart pod if Keycloak is stuck)
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  namespace: keycloak
spec:
  selector:
    app: keycloak
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
```
#### Deploy Keycloak
```
kubectl apply -f keycloak-deployment.yaml
kubectl apply -f keycloak-service.yaml
```
#### Check Keycloak
```
kubectl get pods -n keycloak
kubectl get svc -n keycloak
```
## Keycloak Setup

![Keycloak Admin Console](/images/blog/keycloak.png)
*Keycloak Admin Console for managing authentication and authorization*

1) Access Admin Console

Open:

https://keycloak.shaheen.homes/admin

- Click Administration Console

Login using the admin credentials created during deployment.

2) Create a Dedicated Realm

Do not use master realm for apps.

Create a realm:
- Click on master realm
- Click on Create Realm
- Give a name (example: homelab)
- Click on Create

    Realm name: homelab (recommended)

All users, roles, groups, and clients should be created inside this realm.

- Click on homelab realm
- Click on Users
- Click on Add User
- Give a username (example: shaheen)
- Add email (example: shaheen@shaheen.homes)
- Click on Enable
- Click on save

#### Create Roles & Group
- In homelab realm
- Click on Roles
- Click on Add Role
- Give a name (example: admin)
- Click on save

Create Group:
- Click on Groups
- Click on Add Group
- Give a name (example: admin)
- Click on save

## Gitea Integration with Keycloak (OIDC)

![Gitea OIDC Configuration](/images/blog/gitea2.png)
*Gitea OIDC configuration for Keycloak integration*

1) Create Keycloak Client for Gitea

In Keycloak (homelab realm):

Go to:

Clients → Create client

Use:

- Client type: OpenID Connect
- Client ID: gitea
- Client Name: gitea
- Root URL: https://gitea.shaheen.homes
- Valid redirect URIs: https://gitea.shaheen.homes/*
- Web Origins: https://gitea.shaheen.homes
- Admin URL: https://gitea.shaheen.homes
- Client authentication: ON
- Standard flow: ON

2) Copy Client Secret

Go to:

Clients → gitea → Credentials

Copy:

- Client Secret

## 3) Configure Gitea Authentication Source

In Gitea Admin UI:

Go to:

Site Administration → Identity & Access → Authentication Sources → Add Authentication Source

Set:

- Authentication Type: OAuth2
- Authentication Name: Keycloak
- OAuth2 Provider: OpenID Connect
- Client ID (Key): gitea
- Client Secret: <paste client secret>

OpenID Connect Auto Discovery URL

https://domain/realms/your-realm/.well-known/openid-configuration

Click on Add Authentication Source.

### 4) Validate Login


- Open Gitea login page
- Click Sign in with Keycloak
- Authenticate using Keycloak credentials (with keycloak username and password)
- Confirm redirect back to Gitea and successful login

### Troubleshooting
Symptoms

- You logged in but not redirecting to gitea

Resolve

- Check Valid Redirect URIs in Keycloak client settings

put this: https://gitea.shaheen.homes/*

and open gitea in new tab or in incognito mode and try to login with keycloak.

## Security Notes

- Use a dedicated realm (never use master for apps)
- Regenerate exposed client secrets after setup
- Enable MFA (OTP) in Keycloak for stronger security
- Use HTTPS for all redirect-based login flows

## Troubleshooting: Keycloak + Gitea (OIDC)
#### Sign in to your Keycloak admin console
#### Symptoms:

-  Wrong username and password Authentication Type

#### Resolve

Authentication Type

- Create a user on keycloak homelab realm

### 1) Keycloak Admin UI stuck on “Loading the Admin UI”
#### Symptoms

- Admin console loads but UI stays stuck on loading screen.

#### Common causes

- Reverse proxy / Cloudflare tunnel misconfiguration
- Keycloak does not trust forwarded headers
- Hostname mismatch or incorrect scheme (HTTP vs HTTPS)

#### Fix checklist

- Configure Keycloak for reverse proxy:
  - Proxy mode enabled
  - Hostname set to public domain
  - HTTP enabled internally (if applicable)
- Disable Cloudflare caching/optimization for Keycloak host:
  - Rocket Loader OFF
  - Auto Minify OFF
  - Cache bypass rules

### 2) Cloudflare Error 502 (Bad Gateway)
#### Symptoms

  - Cloudflare shows 502 Bad gateway
  - Cloudflare working, host error

#### Cause

Cloudflare tunnel points to incorrect internal service port.
#### Fix

- Validate the internal Keycloak service port
- Ensure tunnel points to correct service URL:
  - Example: ```http://keycloak.<namespace>.svc.cluster.local:8080```

### 3) Keycloak Error: Invalid parameter: redirect_uri
#### Symptoms

  - Keycloak login page shows:
    - Invalid parameter: redirect_uri

#### Cause

The redirect URI sent by the application does not match client settings.
#### Fix

In Keycloak client settings:

- Add correct redirect URIs:


##### Secure Exposure with Cloudflare Tunnel
Instead of using NodePort or LoadBalancer services, Gitea was exposed using Cloudflare Tunnel.

Benefits:
- No public IP required
- HTTPS by default
- Works behind NAT
- Clean separation between infrastructure and exposure

### Adding Zero-Trust Security with Cloudflare Access
To restrict access further, Cloudflare Access was added in front of the application.
With Access enabled:
- Only approved identities can reach the Gitea UI
- Unauthorized users are blocked before traffic reaches Kubernetes
- Security is enforced at the edge, not just at the application layer

This adds an important Zero-Trust security layer to the setup.

### Key Learnings
This PoC helped me understand:
- How to design Kubernetes resources by reasoning, not copying
- The role of PVCs in real applications
- Service-to-service communication using Kubernetes DNS
- Practical debugging using logs, events, and probes
- Differences between startup, readiness, and liveness probes
- Secure application exposure without opening the cluster publicly
- The value of documenting architecture and decisions clearly

### Conclusion
This project was not about deploying Gitea itself, but about learning how applications behave in Kubernetes and how to operate them responsibly.

By avoiding shortcuts and focusing on fundamentals, this PoC strengthened my confidence in Kubernetes architecture, debugging, and security practices.

I plan to build on this foundation by exploring more complex applications using the same disciplined approach.

