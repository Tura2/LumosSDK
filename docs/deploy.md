# LumosSDK — VPS Deployment Guide

## Prerequisites

- Oracle VPS (Ubuntu 22.04+) with ports 8080 and 3000 open
- Java 17 installed on VPS
- Node.js 18+ installed on VPS
- OpenRouter API key

## 1. VPS firewall setup

In Oracle Cloud Console → VCN → Security Lists, add ingress rules for TCP 8080 and 3000.

On the VPS:
```bash
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
```

## 2. Clone and configure

```bash
git clone <your-repo-url> /opt/lumos
cd /opt/lumos/server
```

Create `/opt/lumos/server/.env`:
```bash
export JWT_SECRET=<generate a long random string>
export OPENROUTER_API_KEY=sk-or-<your-key>
```

## 3. Build and run the server

```bash
cd /opt/lumos/server
chmod +x gradlew
source .env
./gradlew shadowJar
java -jar build/libs/lumos-server-all.jar &
```

Server will start on port 8080.

## 4. Build and serve the portal

```bash
cd /opt/lumos/portal
echo "VITE_API_URL=http://<YOUR_VPS_IP>:8080" > .env
npm install
npm run build
npx serve dist -p 3000 &
```

Portal will be available at `http://<YOUR_VPS_IP>:3000`.

## 5. Configure the demo app

In `demo-app/app/src/main/kotlin/com/lumossdk/demo/DemoApplication.kt`, replace `YOUR_VPS_IP` with your actual VPS IP.

In `demo-app/app/src/main/kotlin/com/lumossdk/demo/ChatViewModel.kt`, replace `YOUR_VPS_IP` with your actual VPS IP.

In `demo-app/local.properties`:
```properties
LUMOS_API_KEY=lms_<your-key-from-portal>
```

## 6. End-to-end smoke test

1. Open `http://<YOUR_VPS_IP>:3000` → register an account
2. Create an app and an API key in the portal
3. Set the key in `local.properties`, rebuild and run the demo app
4. Send a message → confirm the trace appears in the portal's Trace Explorer
