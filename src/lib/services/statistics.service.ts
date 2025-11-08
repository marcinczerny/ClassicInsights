import { supabaseClient } from '@/db/supabase.client';
import type { StatisticsDTO, SuggestionTypeStatsDTO } from '@/types';
import type { Enums } from '@/db/database.types';

const ALL_ENTITY_TYPES: Enums<'entity_type'>[] = [
  'person', 'work', 'idea', 'epoch', 'school', 'system', 'other',
];
const ALL_RELATIONSHIP_TYPES: Enums<'relationship_type'>[] = [
  'criticizes', 'is_student_of', 'expands_on', 'influenced_by', 'is_example_of', 'is_related_to',
];
const ALL_SUGGESTION_TYPES: Enums<'suggestion_type'>[] = [
  'quote', 'summary', 'new_entity', 'existing_entity_link',
];

async function getNotesStatistics(userId: string): Promise<{ total: number; created_this_period: number }> {
  const { count: total, error } = await supabaseClient
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching total notes:', error);
    throw new Error('Failed to fetch note statistics');
  }

  // Simplified: created_this_period is the same as total for now.
  return { total: total || 0, created_this_period: total || 0 };
}

async function getEntitiesStatistics(userId: string): Promise<{ total: number; by_type: Record<Enums<'entity_type'>, number> }> {
  const { data, error } = await supabaseClient
    .from('entities')
    .select('type')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching entity statistics:', error);
    throw new Error('Failed to fetch entity statistics');
  }

  const byType = {} as Record<Enums<'entity_type'>, number>;
  ALL_ENTITY_TYPES.forEach(type => { byType[type] = 0; });

  let total = 0;
  if (data) {
    data.forEach(row => {
      byType[row.type as Enums<'entity_type'>]++;
      total++;
    });
  }

  return { total, by_type: byType };
}

async function getRelationshipsStatistics(userId: string): Promise<{ total: number; by_type: Record<Enums<'relationship_type'>, number> }> {
  const { data, error } = await supabaseClient
    .from('relationships')
    .select('type')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching relationship statistics:', error);
    throw new Error('Failed to fetch relationship statistics');
  }

  const byType = {} as Record<Enums<'relationship_type'>, number>;
  ALL_RELATIONSHIP_TYPES.forEach(type => { byType[type] = 0; });
  
  let total = 0;
  if (data) {
    data.forEach(row => {
      byType[row.type as Enums<'relationship_type'>]++;
      total++;
    });
  }

  return { total, by_type: byType };
}

async function getAISuggestionsStatistics(userId: string): Promise<{
  total_generated: number;
  total_accepted: number;
  total_rejected: number;
  acceptance_rate: number;
  by_type: Record<Enums<'suggestion_type'>, SuggestionTypeStatsDTO>;
}> {
  const { data, error } = await supabaseClient
    .from('ai_suggestions')
    .select('type, status')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching AI suggestion statistics:', error);
    throw new Error('Failed to fetch AI suggestion statistics');
  }

  let totalGenerated = 0, totalAccepted = 0, totalRejected = 0;
  const byType = {} as Record<Enums<'suggestion_type'>, SuggestionTypeStatsDTO>;
  ALL_SUGGESTION_TYPES.forEach(type => {
    byType[type] = { generated: 0, accepted: 0, acceptance_rate: 0 };
  });

  if (data) {
    data.forEach(row => {
      const type = row.type as Enums<'suggestion_type'>;
      totalGenerated++;
      byType[type].generated++;
      if (row.status === 'accepted') {
        totalAccepted++;
        byType[type].accepted++;
      } else if (row.status === 'rejected') {
        totalRejected++;
      }
    });
  }

  const overallAcceptanceRate = totalGenerated > 0 ? totalAccepted / totalGenerated : 0;
  ALL_SUGGESTION_TYPES.forEach(type => {
    const stats = byType[type];
    stats.acceptance_rate = stats.generated > 0 ? stats.accepted / stats.generated : 0;
  });

  return {
    total_generated: totalGenerated,
    total_accepted: totalAccepted,
    total_rejected: totalRejected,
    acceptance_rate: overallAcceptanceRate,
    by_type: byType,
  };
}

export async function getStatistics(userId: string): Promise<StatisticsDTO> {
  try {
    const [notes, entities, relationships, aiSuggestions] = await Promise.all([
      getNotesStatistics(userId),
      getEntitiesStatistics(userId),
      getRelationshipsStatistics(userId),
      getAISuggestionsStatistics(userId),
    ]);

    return { notes, entities, relationships, ai_suggestions: aiSuggestions };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
}
