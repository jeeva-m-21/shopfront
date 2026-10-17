-- Reference Seed: 32 Chennai Localities with Centroids and Aliases per PRD Section 7.8
-- Coordinates format: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography

INSERT INTO localities (name, aliases, center) VALUES
  ('Adyar', '{"Adayar"}', ST_SetSRID(ST_MakePoint(80.2565, 13.0012), 4326)::geography),
  ('Alwarpet', '{}', ST_SetSRID(ST_MakePoint(80.2520, 13.0335), 4326)::geography),
  ('Ambattur', '{}', ST_SetSRID(ST_MakePoint(80.1548, 13.1143), 4326)::geography),
  ('Anna Nagar', '{"Annanagar"}', ST_SetSRID(ST_MakePoint(80.2101, 13.0850), 4326)::geography),
  ('Ashok Nagar', '{"Ashoknagar"}', ST_SetSRID(ST_MakePoint(80.2123, 13.0373), 4326)::geography),
  ('Avadi', '{}', ST_SetSRID(ST_MakePoint(80.1008, 13.1147), 4326)::geography),
  ('Besant Nagar', '{"Besantnagar"}', ST_SetSRID(ST_MakePoint(80.2708, 12.9994), 4326)::geography),
  ('Chromepet', '{"Chrompet"}', ST_SetSRID(ST_MakePoint(80.1462, 12.9517), 4326)::geography),
  ('Egmore', '{}', ST_SetSRID(ST_MakePoint(80.2609, 13.0732), 4326)::geography),
  ('Guindy', '{}', ST_SetSRID(ST_MakePoint(80.2025, 13.0067), 4326)::geography),
  ('K.K. Nagar', '{"KK Nagar", "K. K. Nagar", "Kalaignar Karunanidhi Nagar"}', ST_SetSRID(ST_MakePoint(80.1994, 13.0410), 4326)::geography),
  ('Kilpauk', '{}', ST_SetSRID(ST_MakePoint(80.2437, 13.0827), 4326)::geography),
  ('Kodambakkam', '{}', ST_SetSRID(ST_MakePoint(80.2255, 13.0524), 4326)::geography),
  ('Mandaveli', '{}', ST_SetSRID(ST_MakePoint(80.2610, 13.0245), 4326)::geography),
  ('Medavakkam', '{}', ST_SetSRID(ST_MakePoint(80.1923, 12.9171), 4326)::geography),
  ('Mylapore', '{}', ST_SetSRID(ST_MakePoint(80.2676, 13.0368), 4326)::geography),
  ('Nungambakkam', '{}', ST_SetSRID(ST_MakePoint(80.2405, 13.0604), 4326)::geography),
  ('Pallavaram', '{}', ST_SetSRID(ST_MakePoint(80.1491, 12.9675), 4326)::geography),
  ('Perambur', '{}', ST_SetSRID(ST_MakePoint(80.2434, 13.1075), 4326)::geography),
  ('Perungudi', '{}', ST_SetSRID(ST_MakePoint(80.2461, 12.9654), 4326)::geography),
  ('Poonamallee', '{"Poonamalle"}', ST_SetSRID(ST_MakePoint(80.0945, 13.0474), 4326)::geography),
  ('Porur', '{}', ST_SetSRID(ST_MakePoint(80.1565, 13.0382), 4326)::geography),
  ('Royapettah', '{}', ST_SetSRID(ST_MakePoint(80.2642, 13.0538), 4326)::geography),
  ('Saidapet', '{}', ST_SetSRID(ST_MakePoint(80.2231, 13.0213), 4326)::geography),
  ('Sholinganallur', '{"OMR", "Old Mahabalipuram Road"}', ST_SetSRID(ST_MakePoint(80.2279, 12.9010), 4326)::geography),
  ('T. Nagar', '{"T Nagar", "Thyagaraya Nagar", "T.Nagar"}', ST_SetSRID(ST_MakePoint(80.2341, 13.0418), 4326)::geography),
  ('Tambaram', '{}', ST_SetSRID(ST_MakePoint(80.1278, 12.9249), 4326)::geography),
  ('Teynampet', '{}', ST_SetSRID(ST_MakePoint(80.2505, 13.0405), 4326)::geography),
  ('Thiruvanmiyur', '{"Tiruvanmiyur"}', ST_SetSRID(ST_MakePoint(80.2594, 12.9830), 4326)::geography),
  ('Vadapalani', '{}', ST_SetSRID(ST_MakePoint(80.2121, 13.0500), 4326)::geography),
  ('Velachery', '{"Velacheri"}', ST_SetSRID(ST_MakePoint(80.2180, 12.9815), 4326)::geography),
  ('West Mambalam', '{"Mambalam"}', ST_SetSRID(ST_MakePoint(80.2235, 13.0362), 4326)::geography)
ON CONFLICT (name) DO UPDATE SET
  aliases = EXCLUDED.aliases,
  center = EXCLUDED.center;
