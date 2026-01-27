---
lang: en
title: "Securing Your Homelab: Integrating EasyShop with Keycloak and OAuth2-Proxy"
description: "A comprehensive guide to securing your EasyShop application with Keycloak and OAuth2-Proxy"
pubDate: 2026-01-21
updatedDate: 2026-01-21
heroImage:
  url: "/images/blog/easyshop.png"
  alt: "EasyShop Setup"
tags:
  - "homelab"
  - "kubernetes"
  - "microk8s"
  - "cloudflare"
relatedPosts: []
isDraft: false 
---


# Securing Your Homelab: Integrating EasyShop with Keycloak and OAuth2-Proxy

In the world of self-hosted homelabs, security is paramount. Exposing applications directly to the internet—even via a tunnel—can be risky if they don't have robust built-in authentication.

In this guide, I'll walk you through how to secure the **EasyShop** application using **Keycloak** as our Identity Provider (IdP) and **OAuth2-Proxy** as the gatekeeper. This ensures that only authenticated users can access your application.

## Why this approach?

While some applications support OpenID Connect (OIDC) natively, many don't, or their implementation might be basic. Using **OAuth2-Proxy** provides a standardized, secure layer in front of *any* web application. It handles the login flow with Keycloak and only passes traffic to your app once the user is verified.

---

## Prerequisites

Before we dive in, ensure you have the following ready:

1. **Kubernetes Cluster**: A running cluster (MicroK8s, K3s, etc.).
2. **EasyShop Application**: Deployed and running in the `easyshop-hack` namespace.
3. **Keycloak Instance**: A self-hosted Keycloak instance that is publicly accessible (e.g., `https://keycloak.yourdomain.com`).
4. **Cloudflare Tunnel**: `cloudflared` configured to route traffic to your cluster.
5. **Domain Name**: A domain configured on Cloudflare.

---

## Step 1: Configure Keycloak

First, we need to tell Keycloak about our application.

1. **Log in** to your Keycloak Admin Console.
2. **Select your Realm** (e.g., `homelab`).
3. Navigate to **Clients** and click **Create client**.
4. **Client Settings**:
    * **Client ID**: `easyshop-proxy` (or any unique name)
    * **Client type**: `OpenID Connect`
    * Click **Next**.
5. **Capability config**:
    * **Client authentication**: `ON` (This defines it as a "Confidential" client)
    * **Authentication flow**: Ensure `Standard flow` is checked.
    * Click **Next**.
6. **Login settings**:
    * **Valid Redirect URIs**: This is where Keycloak sends the user back after login.
        * Format: `https://<your-app-url>/oauth2/callback`
        * Example: `https://easyshop-hack.shaheen.homes/oauth2/callback`
    * **Web Origins**: Enter your app's root URL (e.g., `https://easyshop-hack.shaheen.homes`).
    * Click **Save**.

### Get the Client Secret

Once saved, go to the **Credentials** tab of your new client and copy the **Client secret**. You will need this for the next step.

---

## Step 2: Create the OAuth2-Proxy Secret

We need to store our sensitive credentials in a Kubernetes Secret. This includes the Client Secret we just got and a strictly generated cookie secret.

### Generate a Cookie Secret

The cookie secret must be 16, 24, or 32 bytes. You can generate a valid one using Python:

```bash
python3 -c 'import os, base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("="))'
```

### Create the Secret Manifest

Create a file named `oauth2-proxy-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: oauth2-proxy-secret
  namespace: easyshop-hack
type: Opaque
stringData:
  # Paste the Client Secret from Keycloak
  OAUTH2_PROXY_CLIENT_SECRET: "YOUR_KEYCLOAK_CLIENT_SECRET"
  
  # Paste the Cookie Secret generated above
  OAUTH2_PROXY_COOKIE_SECRET: "YOUR_GENERATED_COOKIE_SECRET"
```

Apply it to your cluster:

```bash
kubectl apply -f oauth2-proxy-secret.yaml
```

---

## Step 3: Deploy OAuth2-Proxy

Now we deploy the proxy itself. It will act as the "sidecar" or gateway service.

Create `oauth2-proxy.yaml`. Ensure you configure the Environment Variables to match your setup:

```yaml
# ... (Deployment configuration) ...
env:
  - name: OAUTH2_PROXY_PROVIDER
    value: keycloak-oidc
  - name: OAUTH2_PROXY_OIDC_ISSUER_URL
    value: "https://keycloak.yourdomain.com/realms/homelab" # Update this!
  - name: OAUTH2_PROXY_CLIENT_ID
    value: easyshop-proxy
  - name: OAUTH2_PROXY_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: oauth2-proxy-secret
        key# Securing Your Homelab: Integrating EasyShop with Keycloak and OAuth2-Proxy

In the world of self-hosted homelabs, security is paramount. Exposing applications directly to the internet—even via a tunnel—can be risky if they don't have robust built-in authentication.

In this guide, I'll walk you through how to secure the **EasyShop** application using **Keycloak** as our Identity Provider (IdP) and **OAuth2-Proxy** as the gatekeeper. This ensures that only authenticated users can access your application.

## Why this approach?

While some applications support OpenID Connect (OIDC) natively, many don't, or their implementation might be basic. Using **OAuth2-Proxy** provides a standardized, secure layer in front of *any* web application. It handles the login flow with Keycloak and only passes traffic to your app once the user is verified.

---

## Prerequisites

Before we dive in, ensure you have the following ready:

1. **Kubernetes Cluster**: A running cluster (MicroK8s, K3s, etc.).
2. **EasyShop Application**: Deployed and running in the `easyshop-hack` namespace.
3. **Keycloak Instance**: A self-hosted Keycloak instance that is publicly accessible (e.g., `https://keycloak.yourdomain.com`).
4. **Cloudflare Tunnel**: `cloudflared` configured to route traffic to your cluster.
5. **Domain Name**: A domain configured on Cloudflare.

---

## Step 1: Configure Keycloak

First, we need to tell Keycloak about our application.

1. **Log in** to your Keycloak Admin Console.
2. **Select your Realm** (e.g., `homelab`).
3. Navigate to **Clients** and click **Create client**.
4. **Client Settings**:
    * **Client ID**: `easyshop-proxy` (or any unique name)
    * **Client type**: `OpenID Connect`
    * Click **Next**.
5. **Capability config**:
    * **Client authentication**: `ON` (This defines it as a "Confidential" client)
    * **Authentication flow**: Ensure `Standard flow` is checked.
    * Click **Next**.
6. **Login settings**:
    * **Valid Redirect URIs**: This is where Keycloak sends the user back after login.
        * Format: `https://<your-app-url>/oauth2/callback`
        * Example: `https://easyshop-hack.shaheen.homes/oauth2/callback`
    * **Web Origins**: Enter your app's root URL (e.g., `https://easyshop-hack.shaheen.homes`).
    * Click **Save**.

### Get the Client Secret

Once saved, go to the **Credentials** tab of your new client and copy the **Client secret**. You will need this for the next step.

---

## Step 2: Create the OAuth2-Proxy Secret

We need to store our sensitive credentials in a Kubernetes Secret. This includes the Client Secret we j# Securing Your Homelab: Integrating EasyShop with Keycloak and OAuth2-Proxy

In the world of self-hosted homelabs, security is paramount. Exposing applications directly to the internet—even via a tunnel—can be risky if they don't have robust built-in authentication.

### Get the Client Secret

Once saved, go to the **Credentials** tab of your new client and copy the **Client secret**. You will need this for the next step.

## Step 2: Create the OAuth2-Proxy Secret

We need to store our sensitive credentials in a Kubernetes Secret. This includes the Client Secret we just got and a strictly generated cookie secret.

### Generate a Cookie Secret

The cookie secret must be 16, 24, or 32 bytes. You can generate a valid one using Python:

```bash
python3 -c 'import os, base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("="))'
```

### Create the Secret Manifest

Create a file named `oauth2-proxy-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: oauth2-proxy-secret
  namespace: easyshop-hack
type: Opaque
stringData:
  # Paste the Client Secret from Keycloak
  OAUTH2_PROXY_CLIENT_SECRET: "YOUR_KEYCLOAK_CLIENT_SECRET"
  
  # Paste the Cookie Secret generated above
  OAUTH2_PROXY_COOKIE_SECRET: "YOUR_GENERATED_COOKIE_SECRET"
```

Apply it to your cluster:

```bash
kubectl apply -f oauth2-proxy-secret.yaml
```

## Step 3: Deploy OAuth2-Proxy

Now we deploy the proxy itself. It will act as the "sidecar" or gateway service.

Create `oauth2-proxy.yaml` with the following content:

```yaml
apiVersion: apps/v1
kind: Deployment
```bash
python3 -c 'import os, base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("="))'
```

### Create the Secret Manifest

Create a file named `oauth2-proxy-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: oauth2-proxy-secret
  namespace: easyshop-hack
type: Opaque
stringData:
  # Paste the Client Secret from Keycloak
  OAUTH2_PROXY_CLIENT_SECRET: "YOUR_KEYCLOAK_CLIENT_SECRET"
  
  # Paste the Cookie Secret generated above
  OAUTH2_PROXY_COOKIE_SECRET: "YOUR_GENERATED_COOKIE_SECRET"
```

Apply it to your cluster:

```bash
kubectl apply -f oauth2-proxy-secret.yaml
```

---

## Step 3: Deploy OAuth2-Proxy

Now we deploy the proxy itself. It will act as the "sidecar" or gateway service.

Create `oauth2-proxy.yaml`. Ensure you configure the Environment Variables to match your setup:

```yaml
# ... (Deployment configuration) ...
env:
  - name: OAUTH2_PROXY_PROVIDER
    value: keycloak-oidc
  - name: OAUTH2_PROXY_OIDC_ISSUER_URL
    value: "https://keycloak.yourdomain.com/realms/homelab" # Update this!
  - name: OAUTH2_PROXY_CLIENT_ID
    value: easyshop-proxy
  - name: OAUTH2_PROXY_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: oauth2-proxy-secret
        key: OAUTH2_PROXY_CLIENT_SECRET
  - name: OAUTH2_PROXY_COOKIE_SECRET
    valueFrom:
      secretKeyRef:
        name: oauth2-proxy-secret
        key: OAUTH2_PROXY_COOKIE_SECRET
  - name: OAUTH2_PROXY_UPSTREAMS
    value: "http://easyshop-service:80" # Points to your internal EasyShop service
  - name: OAUTH2_PROXY_HTTP_ADDRESS
    value: "0.0.0.0:4180"
  - name: OAUTH2_PROXY_REDIRECT_URL
    value: "https://easyshop-hack.shaheen.homes/oauth2/callback" # Update this!
  - name: OAUTH2_PROXY_EMAIL_DOMAINS
    value: "*"
```

**Note**: You also need a Service for this proxy (`oauth2-proxy-service.yaml`) exposing port 80/4180.

Apply the deployment and service:

```bash
kubectl apply -f oauth2-proxy.yaml
kubectl apply -f oauth2-proxy-service.yaml
```

---

## Step 4: Update Cloudflare Tunnel Routing

This is the critical "switch". We need to stop routing traffic directly to `easyshop-service` and route it to `oauth2-proxy-service` instead.

1. Open your Cloudflare configuration (ConfigMap or Dashboard).
2. Find the ingress rule for your EasyShop hostname.
3. Change the service endpoint:

**Old:**

```yaml
- hostname: easyshop-hack.shaheen.homes
  service: http://easyshop-service.easyshop-hack.svc.cluster.local:80
```

**New:**

```yaml
- hostname: easyshop-hack.shaheen.homes
  service: http://oauth2-proxy-service.easyshop-hack.svc.cluster.local:80
```

1. Restart your tunnel or `cloudflared` deployment to apply changes.

---

## Common Issues & Troubleshooting

### 1. "Cookie_secret must be 16, 24, or 32 bytes"

If the pod crashes with this error, your generated secret was wrong. Use the Python command provided in Step 2 to generate a correct one.

### 2. "Email in id_token isn't verified"

Keycloak might not be sending a verified email claim. You can force the proxy to accept it by adding this environment variable to your `oauth2-proxy` deployment:

```yaml
- name: OAUTH2_PROXY_INSECURE_OIDC_ALLOW_UNVERIFIED_EMAIL
  value: "true"
```

### 3. Audience Mismatch

If you see an "audience mismatch" error, add this environment variable:

```yaml
- name: OAUTH2_PROXY_OIDC_EXTRA_AUDIENCES
  value: "account"
```

---

## Conclusion

You have now successfully integrated Keycloak with your EasyShop application!

When a user visits `https://easyshop-hack.shaheen.homes`:

1. The request hits the Cloudflare Tunnel.
2. Traffic is routed to **OAuth2-Proxy**.
3. The Proxy sees no session cookie and redirects the user to **Keycloak**.
4. User logs in.
5. Keycloak redirects back to the Proxy with a token.
6. The Proxy verifies the token, sets a cookie, and finally allows the request to reach **EasyShop**.

Enjoy your secure homelab!
: OAUTH2_PROXY_CLIENT_SECRET
  - name: OAUTH2_PROXY_COOKIE_SECRET
    valueFrom:
      secretKeyRef:
        name: oauth2-proxy-secret
        key: OAUTH2_PROXY_COOKIE_SECRET
  - name: OAUTH2_PROXY_UPSTREAMS
    value: "http://easyshop-service:80" # Points to your internal EasyShop service
  - name: OAUTH2_PROXY_HTTP_ADDRESS
    value: "0.0.0.0:4180"
  - name: OAUTH2_PROXY_REDIRECT_URL
    value: "https://easyshop-hack.shaheen.homes/oauth2/callback" # Update this!
  - name: OAUTH2_PROXY_EMAIL_DOMAINS
    value: "*"
```

**Note**: You also need a Service for this proxy (`oauth2-proxy-service.yaml`) exposing port 80/4180.

Apply the deployment and service:

```bash
kubectl apply -f oauth2-proxy.yaml
kubectl apply -f oauth2-proxy-service.yaml
```

---

## Step 4: Update Cloudflare Tunnel Routing

This is the critical "switch". We need to stop routing traffic directly to `easyshop-service` and route it to `oauth2-proxy-service` instead.

1. Open your Cloudflare configuration (ConfigMap or Dashboard).
2. Find the ingress rule for your EasyShop hostname.
3. Change the service endpoint:

**Old:**

```yaml
- hostname: easyshop-hack.shaheen.homes
  service: http://easyshop-service.easyshop-hack.svc.cluster.local:80
```

**New:**

```yaml
- hostname: easyshop-hack.shaheen.homes
  service: http://oauth2-proxy-service.easyshop-hack.svc.cluster.local:80
```

1. Restart your tunnel or `cloudflared` deployment to apply changes.

---

## Common Issues & Troubleshooting

### 1. "Cookie_secret must be 16, 24, or 32 bytes"

If the pod crashes with this error, your generated secret was wrong. Use the Python command provided in Step 2 to generate a correct one.

### 2. "Email in id_token isn't verified"

Keycloak might not be sending a verified email claim. You can force the proxy to accept it by adding this environment variable to your `oauth2-proxy` deployment:

```yaml
- name: OAUTH2_PROXY_INSECURE_OIDC_ALLOW_UNVERIFIED_EMAIL
  value: "true"
```

### 3. Audience Mismatch

If you see an "audience mismatch" error, add this environment variable:

```yaml
- name: OAUTH2_PROXY_OIDC_EXTRA_AUDIENCES
  value: "account"
```

---

## Conclusion

You have now successfully integrated Keycloak with your EasyShop application!

When a user visits `https://easyshop-hack.shaheen.homes`:

1. The request hits the Cloudflare Tunnel.
2. Traffic is routed to **OAuth2-Proxy**.
3. The Proxy sees no session cookie and redirects the user to **Keycloak**.
4. User logs in.
5. Keycloak redirects back to the Proxy with a token.
6. The Proxy verifies the token, sets a cookie, and finally allows the request to reach **EasyShop**.

Enjoy your secure homelab!
