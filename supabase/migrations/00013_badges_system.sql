-- Clear existing badge data and rebuild
DELETE FROM user_badges;
DELETE FROM badges;

-- Collection milestones
INSERT INTO badges (code, name, name_ko, category, condition, tier, is_active) VALUES
('first_sip', 'First Sip', '첫 한 잔', 'collection', '{"type":"collection_count","threshold":1}', 1, true),
('collector', 'Collector', '컬렉터', 'collection', '{"type":"collection_count","threshold":10}', 1, true),
('enthusiast', 'Enthusiast', '애호가', 'collection', '{"type":"collection_count","threshold":30}', 2, true),
('expert', 'Expert', '전문가', 'collection', '{"type":"collection_count","threshold":50}', 3, true),
('connoisseur', 'Connoisseur', '감정가', 'collection', '{"type":"collection_count","threshold":100}', 3, true),
('master', 'Master', '마스터', 'collection', '{"type":"collection_count","threshold":300}', 4, true),
('grand_master', 'Grand Master', '그랜드 마스터', 'collection', '{"type":"collection_count","threshold":500}', 4, true),
('legend', 'Legend', '레전드', 'collection', '{"type":"collection_count","threshold":1000}', 5, true);

-- Country exploration
INSERT INTO badges (code, name, name_ko, category, condition, tier, is_active) VALUES
('passport', 'Passport', '여권', 'region', '{"type":"country_count","threshold":3}', 1, true),
('traveler', 'Traveler', '여행자', 'region', '{"type":"country_count","threshold":5}', 2, true),
('globe_trotter', 'Globe Trotter', '세계 여행가', 'region', '{"type":"country_count","threshold":10}', 3, true),
('world_master', 'World Master', '세계 마스터', 'region', '{"type":"country_count","threshold":20}', 4, true);

-- Category specialization
INSERT INTO badges (code, name, name_ko, category, condition, tier, is_active) VALUES
('red_lover', 'Red Lover', '레드 러버', 'variety', '{"type":"wine_type_count","wine_type":"red","threshold":10}', 1, true),
('white_lover', 'White Lover', '화이트 러버', 'variety', '{"type":"wine_type_count","wine_type":"white","threshold":10}', 1, true),
('whisky_explorer', 'Whisky Explorer', '위스키 탐험가', 'variety', '{"type":"category_count","category":"whiskey","threshold":5}', 1, true),
('sake_beginner', 'Sake Beginner', '사케 입문', 'variety', '{"type":"category_count","category":"sake","threshold":3}', 1, true),
('bubble_fan', 'Bubble Fan', '버블 팬', 'variety', '{"type":"wine_type_count","wine_type":"sparkling","threshold":5}', 2, true),
('red_master', 'Red Master', '레드 마스터', 'variety', '{"type":"wine_type_count","wine_type":"red","threshold":50}', 3, true),
('whisky_master', 'Whisky Master', '위스키 마스터', 'variety', '{"type":"category_count","category":"whiskey","threshold":20}', 3, true);

-- Region master
INSERT INTO badges (code, name, name_ko, category, condition, tier, is_active) VALUES
('bordeaux_lover', 'Bordeaux Lover', '보르도 러버', 'region', '{"type":"region_count","region":"Bordeaux","threshold":5}', 2, true),
('burgundy_lover', 'Burgundy Lover', '부르고뉴 러버', 'region', '{"type":"region_count","region":"Burgundy","threshold":5}', 2, true),
('napa_explorer', 'Napa Explorer', '나파 탐험가', 'region', '{"type":"region_count","region":"Napa Valley","threshold":5}', 2, true),
('islay_fan', 'Islay Fan', '아일라 팬', 'region', '{"type":"region_count","region":"Islay","threshold":3}', 2, true),
('champagne_club', 'Champagne Club', '샴페인 클럽', 'region', '{"type":"region_count","region":"Champagne","threshold":5}', 3, true);

-- Gathering
INSERT INTO badges (code, name, name_ko, category, condition, tier, is_active) VALUES
('social_drinker', 'Social Drinker', '소셜 드링커', 'gathering', '{"type":"gathering_joined","threshold":1}', 1, true),
('party_host', 'Party Host', '파티 호스트', 'gathering', '{"type":"gathering_hosted","threshold":1}', 2, true),
('gathering_master', 'Gathering Master', '모임 마스터', 'gathering', '{"type":"gathering_hosted","threshold":5}', 3, true);
