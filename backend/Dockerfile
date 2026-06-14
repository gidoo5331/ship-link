
FROM node:20-alpine

# Install yarn globally
RUN npm install -g yarn

# Set working directory
WORKDIR /app

# Copy dependencies
COPY package.json yarn-lock ./

# Install dependencies (including dev dependencies)
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

RUN rm -f tsconfig.build.tsbuildinfo

# Expose port and start the application
EXPOSE 8000
CMD ["yarn", "run", "start:dev"]