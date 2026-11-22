import { AudioLines, ScanLine, Waypoints } from 'lucide-react'

export const technologies = [
  {
    id: 'yolo',
    name: 'YOLO',
    title: 'Real-time object detection',
    color: '#54e4f7',
    signal: 'Continuous',
    Icon: ScanLine,
    description: 'A single pass over the frame identifies objects and estimates their locations. In a wearable display, those predictions become the labels and outlines that help you read a scene at a glance.',
    source: 'https://arxiv.org/abs/1506.02640',
  },
  {
    id: 'spikeyolo',
    name: 'SpikeYOLO',
    title: 'Event-driven neural computation',
    color: '#bca5ff',
    signal: 'Spiking',
    Icon: AudioLines,
    description: 'Spiking neurons communicate through discrete pulses. SpikeYOLO brings that approach to object detection, using spike-driven computation to process visual signals efficiently.',
    source: 'https://arxiv.org/abs/2407.20708',
  },
  {
    id: 'vlm',
    name: 'VLM',
    title: 'Vision-language understanding',
    color: '#a8f1b3',
    signal: 'Multimodal',
    Icon: Waypoints,
    description: 'A vision-language model connects images with words. It can describe how objects relate, answer questions about a scene, or turn a visual cue into a sentence.',
    source: 'https://arxiv.org/abs/2304.08485',
  },
] as const

export type Technology = (typeof technologies)[number]
