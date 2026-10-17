# Chennai 32 Localities Centroid & Alias Verification Log

**Milestone:** M1 (Database & Domain)  
**Verification Date:** 2026-10-17  
**Source:** OpenStreetMap / Survey of India Chennai Municipal Bounds  
**Bounding Box Constraint:** `12.75 <= lat <= 13.30`, `79.95 <= lng <= 80.40` (PRD Section 7.6)

---

## 1. Locality Verification Table

All 32 localities have been spot-checked against OpenStreetMap coordinates and confirmed inside the Chennai metropolitan service boundary:

| ID | Name | Primary Aliases | Centroid (Lat, Lng) | Service Box Status | Spot-Check Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Adyar** | `Adayar` | `13.0012, 80.2565` | `PASS` | Centered near Adyar signal / LB Road intersection |
| 2 | **Alwarpet** | *(none)* | `13.0335, 80.2520` | `PASS` | TTK Road & CP Ramaswamy Road junction |
| 3 | **Ambattur** | *(none)* | `13.1143, 80.1548` | `PASS` | Ambattur OT bus terminus |
| 4 | **Anna Nagar** | `Annanagar` | `13.0850, 80.2101` | `PASS` | Roundtana / 2nd Avenue hub |
| 5 | **Ashok Nagar** | `Ashoknagar` | `13.0373, 80.2123` | `PASS` | Ashok Pillar junction |
| 6 | **Avadi** | *(none)* | `13.1147, 80.1008` | `PASS` | Avadi railway station / market area |
| 7 | **Besant Nagar** | `Besantnagar` | `12.9994, 80.2708` | `PASS` | 2nd Avenue / Elliot's Beach corridor |
| 8 | **Chromepet** | `Chrompet` | `12.9517, 80.1462` | `PASS` | GST Road / MIT flyover hub |
| 9 | **Egmore** | *(none)* | `13.0732, 80.2609` | `PASS` | Gandhi Irwin Road / Station perimeter |
| 10 | **Guindy** | *(none)* | `13.0067, 80.2025` | `PASS` | Kathipara / Race Course zone |
| 11 | **K.K. Nagar** | `KK Nagar`, `K. K. Nagar`, `Kalaignar Karunanidhi Nagar` | `13.0410, 80.1994` | `PASS` | K.K. Nagar bus depot corridor |
| 12 | **Kilpauk** | *(none)* | `13.0827, 80.2437` | `PASS` | PH Road / Taylors Road crossing |
| 13 | **Kodambakkam** | *(none)* | `13.0524, 80.2255` | `PASS` | Arcot Road / Power House intersection |
| 14 | **Mandaveli** | *(none)* | `13.0245, 80.2610` | `PASS` | Mandaveli bus terminus / Post Office |
| 15 | **Medavakkam** | *(none)* | `12.9171, 80.1923` | `PASS` | Medavakkam junction / Perumbakkam link |
| 16 | **Mylapore** | *(none)* | `13.0368, 80.2676` | `PASS` | Kapaleeshwarar Temple tank hub |
| 17 | **Nungambakkam** | *(none)* | `13.0604, 80.2405` | `PASS` | Sterling Road / College Road nexus |
| 18 | **Pallavaram** | *(none)* | `12.9675, 80.1491` | `PASS` | Old Trunk Road / GST Road market |
| 19 | **Perambur** | *(none)* | `13.1075, 80.2434` | `PASS` | Perambur Church / Railway colony |
| 20 | **Perungudi** | *(none)* | `12.9654, 80.2461` | `PASS` | OMR IT corridor / Toll gate |
| 21 | **Poonamallee** | `Poonamalle` | `13.0474, 80.0945` | `PASS` | Poonamallee trunk road / bus terminus |
| 22 | **Porur** | *(none)* | `13.0382, 80.1565` | `PASS` | Porur Roundana / Mount-Poonamallee Rd |
| 23 | **Royapettah** | *(none)* | `13.0538, 80.2642` | `PASS` | Clock tower / Peters Road |
| 24 | **Saidapet** | *(none)* | `13.0213, 80.2231` | `PASS` | Saidapet Court / Panagal Building |
| 25 | **Sholinganallur** | `OMR`, `Old Mahabalipuram Road` | `12.9010, 80.2279` | `PASS` | Sholinganallur signal / Medavakkam link |
| 26 | **T. Nagar** | `T Nagar`, `Thyagaraya Nagar`, `T.Nagar` | `13.0418, 80.2341` | `PASS` | Panagal Park / Usman Road retail hub |
| 27 | **Tambaram** | *(none)* | `12.9249, 80.1278` | `PASS` | Tambaram West bus stand / railway hub |
| 28 | **Teynampet** | *(none)* | `13.0405, 80.2505` | `PASS` | Anna Salai / SIET College road |
| 29 | **Thiruvanmiyur** | `Tiruvanmiyur` | `12.9830, 80.2594` | `PASS` | Marundeeswarar Temple / ECR start |
| 30 | **Vadapalani** | *(none)* | `13.0500, 80.2121` | `PASS` | Vadapalani Murugan Temple / 100ft Rd |
| 31 | **Velachery** | `Velacheri` | `12.9815, 80.2180` | `PASS` | Vijayanagar bus terminus / Bypass Rd |
| 32 | **West Mambalam** | `Mambalam` | `13.0362, 80.2235` | `PASS` | Arya Gowda Road / Station corridor |

---

## 2. Invariants Confirmed
- Total row count: Exactly 32.
- Uniqueness: All 32 locality names are distinct.
- Bounding Box: 100% of centroids fall inside `12.75 <= lat <= 13.30` and `79.95 <= lng <= 80.40`.
- Aliases: Crucial colloquial short-forms (`OMR`, `KK Nagar`, `T Nagar`, `Mambalam`) are accurately indexed.
