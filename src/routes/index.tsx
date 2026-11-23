import { createFileRoute } from "@tanstack/react-router";
import { NeuralVision } from "@/neural/ui/NeuralVision";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEURAL VISION — Experience the World Through Artificial Intelligence" },
      {
        name: "description",
        content:
          "An immersive, cinematic exhibition on AI-powered smart glasses, computer vision and the future of human perception.",
      },
      { property: "og:title", content: "NEURAL VISION — Vision Beyond Human" },
      {
        property: "og:description",
        content: "Scroll through the perception system of an artificial intelligence. An interactive exhibition on AI glasses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NeuralVision,
});
