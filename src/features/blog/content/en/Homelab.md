---
lang: en
title: "Build Your Own On-Prem Kubernetes Homelab: Ubuntu + MicroK8s + Cloudflare Zero Trust Tunnel"
description: "A comprehensive introduction to Kubernetes, its components, and core concepts for beginners"
pubDate: 2026-01-19
updatedDate: 2026-01-19
heroImage:
  url: "/images/homelab.png"
  alt: "Homelab Logo"
tags:
  - "homelab"
  - "kubernetes"
  - "microk8s"
  - "cloudflare"
difficulty: "beginner"
relatedPosts: []
isDraft: false
---

## 1) Introduction

In this blog, I will show you how I built my on-prem Kubernetes homelab from scratch.

You will learn:

- How to install Ubuntu OS for an on-prem cluster

- How to install and configure MicroK8s (Kubernetes)

- How to securely access your homelab using Cloudflare Zero Trust Tunnel

- How to expose applications without opening ports in your router

- This blog is written in simple English, so beginners can follow easily.

## 2) What is a Homelab?
A homelab is a self-contained IT environment that you design and control. It usually includes basic infrastructure like compute, storage, and networking, along with a hypervisor or virtualization layer (container). Some setups are modest and run on a single machine, while others resemble mini datacenters with multiple nodes and a shared storage such as SAN or NAS.

In simple terms: A homelab is your own small “data center at home”.
It is a set of servers or PCs where you practice:

- Linux

- Docker & Kubernetes

- CI/CD tools (Jenkins, GitHub Actions)

- Monitoring (Grafana/Prometheus)

- Identity & SSO (Keycloak)

## Why I built my homelab

- To learn DevOps with real infrastructure

- To deploy real apps like industry projects

- To troubleshoot real issues in a safe environment and to strengthen my concepts and problem-solving skills

- To gain confidence for interviews

## 3) Why I chose Ubuntu for my on-prem cluster
### What is Ubuntu?
Ubuntu is a free and open-source operating system based on the Linux kernel, developed and maintained by Canonical Ltd. Since its initial release in 2004, Ubuntu has grown rapidly in popularity due to its ease of use, stability, and vast ecosystem of applications and tools.

### Why Ubuntu is popular?
Ubuntu is a popular Linux operating system.
It is:

Free and open-source

Stable

Beginner-friendly

Widely used in cloud and production servers

### Why Ubuntu is best for MicroK8s

MicroK8s is maintained by Canonical (Ubuntu company), and it works best on Ubuntu. MicroK8s installs using snap, and Ubuntu supports snap by default.

### 4) Install Ubuntu OS (Step-by-step)
#### Minimum Requirements

- CPU: 2 cores (4 cores better)

- RAM: 4 GB minimum (8 GB recommended)

- Storage: 50 GB+

- Network: stable internet

### After Ubuntu installation (Important setup)

#### Run these commands after installing Ubuntu:
```
sudo apt update
sudo apt upgrade -y
sudo reboot
```

#### Set hostname (optional but good)
```
sudo hostnamectl set-hostname homelab-master
```


### 5) What is MicroK8s?
#### MicroK8s in simple words

MicroK8s is a lightweight Kubernetes distribution.
It is:

Small

Fast

Easy to install

Perfect for local/on-prem clusters

MicroK8s can run on a single VM or can scale to multi-node HA cluster.

### Why I choose MicroK8s

Very easy installation

Works great on Ubuntu

Quick setup for learners

Great for homelab practice

### 6) Install MicroK8s on Ubuntu
#### Step 1: Install MicroK8s
```
sudo snap install microk8s --classic
```


#### Step 2: Add your user to microk8s group

This helps you run commands without sudo.

```
sudo usermod -a -G microk8s $USER
sudo chown -R $USER ~/.kube
newgrp microk8s
```

#### Step 3: Check MicroK8s status
```
microk8s status --wait-ready
```

#### Step 4: Use kubectl

MicroK8s has its own kubectl:

To see your node as "Ready":
```
microk8s kubectl get nodes
```

To get information about cluster:
```
microk8s kubect cluster-info
```

To get information about all pods:
```
microk8s kubect get pod
microk8s kubect get pod --all-namespaces
```
To install kubectl:
```bash
sudo snap install kubectl --classic
```

### Enable useful add-ons like for service descovery (CoreDNS) and web UI (Kubernetes Dashboard):
```
microk8s enable dns
```

Check status:
```
microk8s status
```

### What is Cloudflare?

Cloudflare is a cloud computing company that provides a content delivery network (CDN), DNS, and other services. It is used to provide a secure and reliable connection between the user and the server.

### What is Tunnel?

Tunnel is a feature of Cloudflare that allows you to create a secure connection between your home lab and the internet without exposing your home lab to the internet.

## 8) Why I chose Cloudflare for On-Prem Kubernetes
### Problem in on-prem environment

When we run Kubernetes at home:

- Our services are inside private network (LAN)

- We don’t have a fixed public IP

- We don’t want to open router ports (Port Forwarding)

- Security risk is high if we expose apps directly

### Solution:

Use Cloudflare Zero Trust Tunnel.

Cloudflare Tunnel creates an outbound-only secure connection from our homelab to Cloudflare.
So no direct inbound access is needed.

### 9) What is Cloudflare Zero Trust Tunnel?
Simple meaning

A Zero Trust Tunnel means:

- Do not trust anyone by default

- Verify access using identity and policy

- Allow only authorized users

Cloudflare Tunnel:

- connects your homelab to Cloudflare securely

- helps expose applications without opening ports

- works even if you don’t have a public IP

### 10) Setup Cloudflare Zero Trust Tunnel (Step-by-step)
#### Prerequisites

You need:

- A domain added to Cloudflare

- Cloudflare Zero Trust enabled

### Step 1: Create a Tunnel in Cloudflare dashboard

1. Go to Cloudflare Dashboard

2. Go to Zero Trust

3. Go to Networks → Tunnels

4. Click Create Tunnel

5. Select Cloudflared

6. Give a name (example: homelab-tunnel)

7. Cloudflare will show you a command/token

(These steps are the official way shown in multiple docs/tutorials.)

(Now the question is how it will connect to our homelab? For that we need to install cloudflared cli and )


## Step 2: Install cloudflared on Ubuntu

Cloudflare provides install methods, but simplest is to run tunnel using the token command provided by dashboard.



Install cloudflalred cli:
```
sudo snap install cloudflared
```

Authenticate:
```
cloudflared tunnel login
```

Create tunnel:
```
cloudflared create tunnel home-lab-tunnel
```

Create token to cloudflare tunnel in the terminal ( also creating sercret in emprative way):
```
kubectl -n cloudflare create secret generic cloudflared-token \  --from-literal=TUNNEL_TOKEN="<YOUR_TUNNEL_TOKEN>"
```

(This creates a secure tunnel from your server to Cloudflare.)


#### cloudflare-namespace.yaml
```
apiVersion: v1
kind: Namespace
metadata:
  name: cloudflare
```
#### cloudflare-config.yaml

- (Template file - Replace TUNNEL_ID_PLACEHOLDER with your actual tunnel ID)
- (You can use: sed 's/TUNNEL_ID_PLACEHOLDER/your-tunnel-id/g' cloudflared-config-template.yaml > cloudflared-config.yaml)
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: cloudflared-config
  namespace: cloudflare
data:
  config.yaml: |
    tunnel: 04d18c17-c8b6-414e-ad1b-3c226b5f6373
    credentials-file: /etc/cloudflared/creds.json
    
    ingress:
      # Route traffic from Cloudflare to the easyshop service
      - hostname: easyshop-hack.shaheen.homes
        service: http://easyshop-service.easyshop-hack.svc.cluster.local:80
      
      # Route traffic from Cloudflare to Grafana
      - hostname: grafana.shaheen.homes
        service: http://my-grafana.observability.svc.cluster.local:3000
      
      # Route traffic from Cloudflare to Prometheus
      - hostname: prometheus.shaheen.homes
        service: http://prometheus.observability.svc.cluster.local:9090
      
      # Catch-all rule (must be last)
      - service: http_status:404
```
    
#### Cloudflared-deploy.yaml
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflared
  namespace: cloudflare
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cloudflared
  template:
    metadata:
      labels:
        app: cloudflared
    spec:
      containers:
      - name: cloudflared
        image: cloudflare/cloudflared:latest
        args:
          - tunnel
          - --no-autoupdate
          - run
        env:
          - name: TUNNEL_TOKEN
            valueFrom:
              secretKeyRef:
                name: cloudflared-token
                key: TUNNEL_TOKEN
```
```
microk8s kubectl apply -f cloudflare-namespace.yaml

microk8s kubectl apply -f cloudflare-config.yaml

microk8s kubectl apply -f cloudflared-deploy.yaml

microk8s kubectl get pods -n cloudflare
```

This deploys a Deployment/Pod that runs cloudflared in your MicroK8s cluster and connects back to your Tunnel.

After tunnel is running:

Check tunnel status
```
cloudflared tunnel list
```

Now your tunnel is running and forwarding traffic from Cloudflare to your services in the cluster, you can integrate your application with it.