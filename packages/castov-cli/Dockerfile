# syntax=docker/dockerfile:1
FROM node:20-alpine

LABEL org.opencontainers.image.title="Castov CLI" \
      org.opencontainers.image.description="Fast, offline developer utilities & MCP server in your terminal" \
      org.opencontainers.image.url="https://castov.com" \
      org.opencontainers.image.source="https://github.com/castovdev/castov" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install castov globally without dev dependencies
RUN npm install -g castov@1.3.3 --omit=dev

# Run as non-root user for security
USER node

ENTRYPOINT ["castov"]
CMD ["--help"]
