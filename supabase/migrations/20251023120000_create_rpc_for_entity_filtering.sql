CREATE OR REPLACE FUNCTION get_notes_with_all_entities(p_entity_ids UUID[], p_user_id UUID)
RETURNS TABLE(id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ne.note_id
  FROM note_entities ne
  JOIN notes n ON ne.note_id = n.id
  WHERE n.user_id = p_user_id AND ne.entity_id = ANY(p_entity_ids)
  GROUP BY ne.note_id
  HAVING COUNT(DISTINCT ne.entity_id) = array_length(p_entity_ids, 1);
END;
$$ LANGUAGE plpgsql;
