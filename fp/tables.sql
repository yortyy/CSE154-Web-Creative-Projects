CREATE TABLE "users" (
	"username"	TEXT,
	"password"	TEXT,
	"lineup1"	TEXT,
	"lineup2"	TEXT,
	"lineup3"	TEXT,
	"order_history"	TEXT,
	PRIMARY KEY("username")
);

CREATE TABLE "PlayerBioRef" (
	"player_id"	INTEGER,
	"height"	TEXT,
	"weight"	TEXT,
	"college"	TEXT,
	"country"	TEXT,
	"draft_year"	TEXT,
	"draft_pick"	TEXT,
	"fun_fact"	TEXT,
	PRIMARY KEY("player_id")
);

CREATE TABLE "PlayerMetaRef" (
	"player_name"	TEXT,
	"team_name"	INTEGER,
	"team_code"	TEXT,
	"playerId"	INTEGER,
	"teamId"	INTEGER,
	"price"	INTEGER
);

CREATE TABLE "PlayerStatsRef" (
	"rk"	INTEGER,
	"player"	TEXT,
	"pos"	TEXT,
	"age"	TEXT,
	"tm"	TEXT,
	"g"	INTEGER,
	"gs"	INTEGER,
	"mp_"	decimal(15, 5),
	"fg"	decimal(15, 5),
	"fga"	decimal(15, 5),
	"fg_"	decimal(15, 5),
	"col_3p"	decimal(15, 5),
	"col_3pa"	decimal(15, 5),
	"col_3p_"	decimal(15, 5),
	"col_2p"	decimal(15, 5),
	"col_2pa"	decimal(15, 5),
	"col_2p_"	decimal(15, 5),
	"efg_"	decimal(15, 5),
	"ft"	decimal(15, 5),
	"fta"	decimal(15, 5),
	"ft_"	decimal(15, 5),
	"orb"	decimal(15, 5),
	"drb"	decimal(15, 5),
	"trb"	decimal(15, 5),
	"ast"	decimal(15, 5),
	"stl"	decimal(15, 5),
	"blk"	decimal(15, 5),
	"tov"	decimal(15, 5),
	"pf"	decimal(15, 5),
	"pts"	decimal(15, 5),
	"player_additional"	varchar(64),
	PRIMARY KEY("rk")
);