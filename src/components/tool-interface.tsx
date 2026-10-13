"use client";

import type { ToolSlug } from "@/content/tools";
import dynamic from "next/dynamic";
import { JsonViewerTool } from "./tools/json-viewer-tool";
import { P2pGhostTunnelTool } from "./tools/p2p-ghost-tunnel-tool";
import { SteganographyEnvVaultTool } from "./tools/steganography-env-vault-tool";

const ThreeJsonGalaxyTool = dynamic(
  () => import("./tools/3d-json-galaxy-tool").then((m) => m.ThreeJsonGalaxyTool),
  {
    ssr: false,
    loading: () => (
      <div className="card p-12 text-center text-muted font-mono text-sm">
        Loading 3D Galaxy Canvas...
      </div>
    ),
  }
);
import { RegexGeneticEvolutionTool } from "./tools/regex-genetic-evolution-tool";
import { ApiTimeMachineTool } from "./tools/api-time-machine-tool";
import { AstConflictTelepathyTool } from "./tools/ast-conflict-telepathy-tool";
import { BatchConverterTool } from "./tools/batch-converter-tool";
import { BusinessHoursTool } from "./tools/business-hours-tool";
import { CronGeneratorTool } from "./tools/cron-generator-tool";
import { CurrentTimestampTool } from "./tools/current-timestamp-tool";
import { DateDifferenceTool } from "./tools/date-difference-tool";
import { DateFormatConverterTool } from "./tools/date-format-converter-tool";
import { DateToTimestampTool } from "./tools/date-to-timestamp-tool";
import { Iso8601ConverterTool } from "./tools/iso8601-converter-tool";
import { IsoToUnixTool } from "./tools/iso-to-unix-tool";
import { Rfc3339Tool } from "./tools/rfc3339-tool";
import { ShiftTimeTool } from "./tools/shift-time-tool";
import { TimeDurationTool } from "./tools/time-duration-tool";
import { TimestampDifferenceTool } from "./tools/timestamp-difference-tool";
import { TimestampTool } from "./tools/timestamp-tool";
import { TimezoneConverterTool } from "./tools/timezone-converter-tool";
import { TimezoneOffsetTool } from "./tools/timezone-offset-tool";
import { UnixValidatorTool } from "./tools/unix-validator-tool";
import { UtcConverterTool } from "./tools/utc-converter-tool";
import { WorldClockTool } from "./tools/world-clock-tool";
import { TimezoneSimulatorTool } from "./tools/timezone-simulator-tool";
import { UniversalConfigTool } from "./tools/universal-config-tool";
import { EnvVaultTool } from "./tools/env-vault-tool";
import { SecretScannerTool } from "./tools/secret-scanner-tool";
import { ApiLoadTesterTool } from "./tools/api-load-tester-tool";
import { DockerVisualizerTool } from "./tools/docker-visualizer-tool";
import { SqliteFiddleTool } from "./tools/sqlite-fiddle-tool";
import { RegexExplainerTool } from "./tools/regex-explainer-dynamic";
import { FetchMockGeneratorTool } from "./tools/fetch-mock-generator-tool";
import { JsonToTsTool } from "./tools/json-to-ts-tool";
import { DiffCheckerTool } from "./tools/diff-checker-tool";
import { NexusGridTool } from "./tools/nexus-grid-tool";
import { SonicGapBridgeTool } from "./tools/sonic-gap-bridge-tool";
const QuantumSimulatorTool = dynamic(
  () => import("./tools/quantum-simulator-tool").then((m) => m.QuantumSimulatorTool),
  {
    ssr: false,
    loading: () => (
      <div className="card p-12 text-center text-muted font-mono text-sm">
        Initializing Quantum Simulator...
      </div>
    ),
  }
);
import { JsonFormatterTool } from "./tools/json-formatter-tool";
import { Base64Tool } from "./tools/base64-tool";
import { JwtDecoderTool } from "./tools/jwt-decoder-tool";
import { UuidGeneratorTool } from "./tools/uuid-generator-tool";
import { HashGeneratorTool } from "./tools/hash-generator-tool";
import { CodeToImageTool } from "./tools/code-to-image-tool";
import { GlassmorphismTool } from "./tools/glassmorphism-tool";
import { GithubReadmeTool } from "./tools/github-readme-tool";
import { AppMockupTool } from "./tools/app-mockup-tool";
import { FaviconGeneratorTool } from "./tools/favicon-generator-tool";
import { ColorConverterTool } from "./tools/color-converter-tool";
import { TokenCostVisualizerTool } from "./tools/token-visualizer-tool";
import { GitTimeTravelerTool } from "./tools/git-time-traveler-tool";
import { SvgKeyframeAnimatorTool } from "./tools/svg-animator-tool";
import { MockDataStudioTool } from "./tools/mock-data-studio-tool";

/**
 * Maps a tool slug to its interactive interface. To add a tool: add its content to
 * src/content/tools.ts (and examples.ts), build its component, and register it here.
 */
export function ToolInterface({ slug }: { slug: ToolSlug }) {
  switch (slug) {
    case "unix-timestamp-converter":
      return <TimestampTool variant="unix" />;
    case "epoch-converter":
      return <TimestampTool variant="epoch" />;
    case "timestamp-to-date":
      return <TimestampTool variant="toDate" />;
    case "milliseconds-to-date":
      return <TimestampTool variant="ms" />;
    case "epoch-milliseconds":
      return <TimestampTool variant="ms" />;
    case "unix-to-iso-8601":
      return <TimestampTool variant="toIso" />;
    case "date-to-timestamp":
      return <DateToTimestampTool />;
    case "current-unix-timestamp":
      return <CurrentTimestampTool />;
    case "iso-8601-to-unix":
      return <IsoToUnixTool />;
    case "timezone-converter":
      return <TimezoneConverterTool />;
    case "timestamp-difference":
      return <TimestampDifferenceTool />;
    case "utc-converter":
      return <UtcConverterTool />;
    case "date-difference":
      return <DateDifferenceTool />;
    case "time-duration-calculator":
      return <TimeDurationTool />;
    case "add-time":
      return <ShiftTimeTool sign={1} />;
    case "subtract-time":
      return <ShiftTimeTool sign={-1} />;
    case "unix-timestamp-validator":
      return <UnixValidatorTool />;
    case "unix-timestamp-batch-converter":
      return <BatchConverterTool />;
    case "date-format-converter":
      return <DateFormatConverterTool />;
    case "iso-8601-converter":
      return <Iso8601ConverterTool />;
    case "rfc-3339-converter":
      return <Rfc3339Tool />;
    case "timezone-offset":
      return <TimezoneOffsetTool />;
    case "world-clock":
      return <WorldClockTool />;
    case "business-hours-converter":
      return <BusinessHoursTool />;
    case "cron-generator":
      return <CronGeneratorTool />;
    case "timezone-simulator":
      return <TimezoneSimulatorTool />;
    case "universal-config-sync":
      return <UniversalConfigTool />;
    case "env-vault":
      return <EnvVaultTool />;
    case "secret-scanner":
      return <SecretScannerTool />;
    case "api-load-tester":
      return <ApiLoadTesterTool />;
    case "docker-visualizer":
      return <DockerVisualizerTool />;
    case "sqlite-fiddle":
      return <SqliteFiddleTool />;
    case "regex-explainer":
      return <RegexExplainerTool />;
    case "json-viewer":
      return <JsonViewerTool />;
    case "p2p-ghost-tunnel":
      return <P2pGhostTunnelTool />;
    case "steganography-env-vault":
      return <SteganographyEnvVaultTool />;
    case "3d-json-galaxy":
      return <ThreeJsonGalaxyTool />;
    case "regex-genetic-evolution":
      return <RegexGeneticEvolutionTool />;
    case "api-time-machine":
      return <ApiTimeMachineTool />;
    case "ast-conflict-telepathy":
      return <AstConflictTelepathyTool />;
    case "fetch-mock-generator":
      return <FetchMockGeneratorTool />;
    case "json-to-ts":
      return <JsonToTsTool />;
    case "diff-checker":
      return <DiffCheckerTool />;
    case "nexus-grid":
      return <NexusGridTool />;
    case "sonic-gap":
      return <SonicGapBridgeTool />;
    case "quantum":
      return <QuantumSimulatorTool />;
    case "json-formatter":
      return <JsonFormatterTool />;
    case "base64-encoder-decoder":
      return <Base64Tool />;
    case "jwt-decoder":
      return <JwtDecoderTool />;
    case "uuid-generator":
      return <UuidGeneratorTool />;
    case "hash-generator":
      return <HashGeneratorTool />;
    case "code-to-image":
      return <CodeToImageTool />;
    case "glassmorphism-generator":
      return <GlassmorphismTool />;
    case "github-readme-generator":
      return <GithubReadmeTool />;
    case "app-mockup":
      return <AppMockupTool />;
    case "favicon-generator":
      return <FaviconGeneratorTool />;
    case "color-converter":
      return <ColorConverterTool />;
    case "token-visualizer":
      return <TokenCostVisualizerTool />;
    case "git-time-traveler":
      return <GitTimeTravelerTool />;
    case "svg-animator":
      return <SvgKeyframeAnimatorTool />;
    case "mock-data-studio":
      return <MockDataStudioTool />;
  }
}
