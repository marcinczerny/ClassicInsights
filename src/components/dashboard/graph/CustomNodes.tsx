/**
 * Custom node components for graph visualization
 *
 * Defines how entity and note nodes are rendered in the graph
 */

import { Handle, Position, type Node } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeDTO } from "@/types";

type EntityNodeData = Node<Omit<GraphNodeDTO, "id" | "type"> & { label: string }>;
/**
 * Custom node for Entity type
 */
export function EntityNode({ data }: NodeProps<EntityNodeData>) {
  const { entity_type, description, label } = data;

  const typeColors: Record<string, string> = {
    person: "bg-blue-500",
    place: "bg-green-500",
    concept: "bg-purple-500",
    event: "bg-orange-500",
    object: "bg-yellow-500",
  };

  const bgColor = typeColors[entity_type ?? ""] || "bg-gray-500";

  return (
    <div className={`min-w-[150px] rounded-lg border-2 border-white bg-indigo-500 px-4 py-3 shadow-lg ${bgColor}`}>
      <Handle type="target" position={Position.Top} className="!bg-white" />

      <div className="text-center">
        <div className="mb-1 text-xs font-semibold uppercase text-white/70">{entity_type}</div>
        <div className="font-semibold text-white">{label}</div>
        {description && <div className="mt-1 line-clamp-2 text-xs text-white/80">{description}</div>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white" />
    </div>
  );
}

type NoteNodeData = Node<Omit<GraphNodeDTO, "id" | "type"> & { label: string }>;

/**
 * Custom node for Note type
 */
export function NoteNode({ data }: NodeProps<NoteNodeData>) {
  const { note_preview, label } = data;

  return (
    <div className="min-w-[150px] rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />

      <div className="text-center">
        <div className="mb-1 text-xs font-semibold uppercase text-amber-700">Notatka</div>
        <div className="font-semibold text-amber-900">{label}</div>
        {note_preview && <div className="mt-1 text-xs text-amber-700 line-clamp-2">{note_preview}</div>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
    </div>
  );
}

/**
 * Node types map for @xyflow/react
 */
export const nodeTypes = {
  entity: EntityNode,
  note: NoteNode,
};
