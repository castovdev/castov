# Official Castov MCP & CLI Container (Multi-stage, Alpine, Non-root)
FROM node:20-alpine

LABEL org.opencontainers.image.title="Castov MCP & CLI" \
      org.opencontainers.image.description="AI Execution Layer (MCP Server) & 61 Local Developer Utilities with no behavioral telemetry" \
      org.opencontainers.image.vendor="Castov (https://castov.com)" \
      org.opencontainers.image.source="https://github.com/castovdev/castov" \
      org.opencontainers.image.licenses="MIT"

# Install latest published Castov CLI & MCP Server globally
RUN npm install -g castov@1.4.0 --omit=dev && npm cache clean --force

# Security best practice: run as non-root user
USER node
WORKDIR /home/node

# Default to stdio MCP server when no CLI arguments are passed (for Glama / Claude Desktop Docker MCP),
# while allowing any CLI subcommand (e.g. `docker run --rm castovdev/castov uuid --v7`) to override CMD.
ENTRYPOINT ["castov"]
CMD ["mcp"]
