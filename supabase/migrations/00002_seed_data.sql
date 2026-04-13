-- ============================================
-- I Cave - Sample Seed Data
-- For development & feature testing
-- ============================================

-- ===================
-- Wines (주류 마스터 데이터)
-- ===================

insert into wines (category, name, name_ko, wine_type, producer, region, country, grape_variety, vintage_year, alcohol_pct, verified) values
-- Wines
('wine', 'Chateau Margaux 2018', '샤또 마고', 'red', 'Chateau Margaux', 'Bordeaux', 'France', ARRAY['Cabernet Sauvignon', 'Merlot'], 2018, 13.5, true),
('wine', 'Opus One 2019', '오퍼스 원', 'red', 'Opus One Winery', 'Napa Valley', 'USA', ARRAY['Cabernet Sauvignon'], 2019, 14.5, true),
('wine', 'Sassicaia 2018', '사시카이아', 'red', 'Tenuta San Guido', 'Bolgheri', 'Italy', ARRAY['Cabernet Sauvignon', 'Cabernet Franc'], 2018, 14.0, true),
('wine', 'Dom Perignon 2012', '돔 페리뇽', 'sparkling', 'Dom Perignon', 'Champagne', 'France', ARRAY['Chardonnay', 'Pinot Noir'], 2012, 12.5, true),
('wine', 'Penfolds Grange 2017', '펜폴즈 그레인지', 'red', 'Penfolds', 'Barossa Valley', 'Australia', ARRAY['Shiraz'], 2017, 14.5, true),
('wine', 'Domaine de la Romanee-Conti 2019', '도멘 드 라 로마네 콩티', 'red', 'DRC', 'Burgundy', 'France', ARRAY['Pinot Noir'], 2019, 13.0, true),
('wine', 'Cloudy Bay Sauvignon Blanc 2022', '클라우디 베이', 'white', 'Cloudy Bay', 'Marlborough', 'New Zealand', ARRAY['Sauvignon Blanc'], 2022, 13.5, true),
('wine', 'Chablis Premier Cru 2021', '샤블리 프리미에 크뤼', 'white', 'William Fevre', 'Burgundy', 'France', ARRAY['Chardonnay'], 2021, 12.5, true),
('wine', 'Caymus Cabernet Sauvignon 2020', '케이머스 카베르네', 'red', 'Caymus Vineyards', 'Napa Valley', 'USA', ARRAY['Cabernet Sauvignon'], 2020, 14.5, true),
('wine', 'Antinori Tignanello 2019', '안티노리 티냐넬로', 'red', 'Marchesi Antinori', 'Tuscany', 'Italy', ARRAY['Sangiovese', 'Cabernet Sauvignon'], 2019, 14.0, true),

-- Whiskies
('whiskey', 'Yamazaki 18 Year', '야마자키 18년', null, 'Suntory', 'Osaka', 'Japan', null, null, 43.0, true),
('whiskey', 'Macallan 18 Year Sherry Oak', '맥캘란 18년 쉐리오크', null, 'The Macallan', 'Speyside', 'Scotland', null, null, 43.0, true),
('whiskey', 'Lagavulin 16 Year', '라가불린 16년', null, 'Lagavulin', 'Islay', 'Scotland', null, null, 43.0, true),
('whiskey', 'Hibiki 21 Year', '히비키 21년', null, 'Suntory', 'Japan', 'Japan', null, null, 43.0, true),
('whiskey', 'Glenfiddich 18 Year', '글렌피딕 18년', null, 'Glenfiddich', 'Speyside', 'Scotland', null, null, 40.0, true),
('whiskey', 'Ardbeg Uigeadail', '아드벡 우가달', null, 'Ardbeg', 'Islay', 'Scotland', null, null, 54.2, true),
('whiskey', 'Buffalo Trace', '버팔로 트레이스', null, 'Buffalo Trace Distillery', 'Kentucky', 'USA', null, null, 45.0, true),
('whiskey', 'Hakushu 12 Year', '하쿠슈 12년', null, 'Suntory', 'Yamanashi', 'Japan', null, null, 43.0, true),

-- Sake
('sake', 'Juyondai Junmai Daiginjo', '주욘다이 준마이 다이긴조', null, 'Takagi Shuzo', 'Yamagata', 'Japan', null, null, 16.0, true),
('sake', 'Dassai 23', '닷사이 23', null, 'Asahi Shuzo', 'Yamaguchi', 'Japan', null, null, 16.0, true),
('sake', 'Hakkaisan Tokubetsu Junmai', '하카이산 토쿠베츠 준마이', null, 'Hakkaisan Brewery', 'Niigata', 'Japan', null, null, 15.5, true),
('sake', 'Kubota Manju', '쿠보타 만주', null, 'Asahi Shuzo Niigata', 'Niigata', 'Japan', null, null, 15.0, true),

-- Cognac
('cognac', 'Hennessy XO', '헤네시 XO', null, 'Hennessy', 'Cognac', 'France', null, null, 40.0, true),
('cognac', 'Remy Martin Louis XIII', '레미 마르땅 루이 13세', null, 'Remy Martin', 'Cognac', 'France', null, null, 40.0, true),

-- Korean Traditional
('other', '화요 41', '화요', null, '화요', 'Gyeonggi', 'Korea', null, null, 41.0, true),
('other', '일품진로', '일품진로', null, 'Jinro', 'Korea', 'Korea', null, null, 23.0, true);
