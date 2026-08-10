# Form Intelligence SDK — demo container
# Builds the SDK workspace package, then runs the Vite demo app.
FROM node:20-alpine

WORKDIR /app

# Install deps first (cache layer) — copy every workspace package.json so
# `npm install` at the root resolves the whole workspace tree.
COPY package.json package-lock.json ./
COPY packages/form-intelligence-sdk/package.json packages/form-intelligence-sdk/package.json
COPY apps/demo/package.json apps/demo/package.json
RUN npm install

# Now bring in the actual source and build the SDK package that the demo
# app depends on via the "@formintel/react-sdk": "*" workspace link.
COPY . .
RUN npm run build:sdk

EXPOSE 5173

CMD ["npm", "run", "dev:demo"]
