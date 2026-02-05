import { Config } from "@remotion/cli/config";

// Use PNG for lossless quality - better for gradients and blur effects
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
// Limit concurrency to prevent memory issues with heavy blur effects
Config.setConcurrency(4);
