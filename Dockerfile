FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the project
RUN pnpm run build

# Expose port
EXPOSE 3008

# Start the API server
CMD ["pnpm", "run", "start:api"]
