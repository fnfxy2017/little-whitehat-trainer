// 第一幕 8 关数据(主包内联)·  自动生成,改请改 levels/*.json 后重跑
module.exports = {
  T1: {
  "id": "T1",
  "title": "醒来的婉婉",
  "act": 1,
  "chapter": "学徒篇",
  "location": "婉婉的卧室",
  "concept_intro": "方向指令",
  "available_commands": [
    "direction"
  ],
  "intro_dialog": [
    {
      "speaker": "小天",
      "text": "婉婉！醒醒！"
    },
    {
      "speaker": "小天",
      "text": "指令星球出大事啦！"
    },
    {
      "speaker": "小天",
      "text": "快到门口来，我告诉你！"
    },
    {
      "speaker": "旁白",
      "text": "用方向指令，让婉婉走到门口。"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "bedroom",
    "floor_tiles": "wood",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      }
    ],
    "objects": [
      {
        "type": "bed",
        "pos": [
          1,
          2
        ],
        "size": [
          2,
          2
        ]
      },
      {
        "type": "desk",
        "pos": [
          7,
          1
        ],
        "size": [
          2,
          1
        ]
      },
      {
        "type": "tv",
        "pos": [
          5,
          1
        ],
        "animate": "xiaotian_glow"
      },
      {
        "type": "rug",
        "pos": [
          4,
          4
        ],
        "size": [
          2,
          2
        ],
        "decorative": true
      },
      {
        "type": "window",
        "pos": [
          4,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "lamp",
        "pos": [
          7,
          2
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          1,
          5
        ],
        "size": [
          1,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        2,
        2
      ],
      "facing": "down"
    },
    {
      "id": "goal",
      "type": "door",
      "pos": [
        8,
        6
      ],
      "goal": true
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    }
  ],
  "success_condition": {
    "type": "reach_goal",
    "entity": "player",
    "goal_id": "goal"
  },
  "optimal_steps": 2,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "先向右走几步，再向下走。"
    },
    {
      "level": 2,
      "text": "向右走6步，再向下走4步。"
    },
    {
      "level": 3,
      "text": "按顺序拖入：「向右移动6步」「向下移动4步」。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "小天",
      "text": "做得好！"
    },
    {
      "speaker": "小天",
      "text": "你学会了方向指令。"
    },
    {
      "speaker": "小天",
      "text": "这是最重要的一种哦。"
    },
    {
      "speaker": "小天",
      "text": "指令星球被坏人搞乱了。"
    },
    {
      "speaker": "小天",
      "text": "需要你帮忙，准备好了吗？"
    }
  ],
  "rewards": {
    "unlock_next": "T2",
    "unlock_character": null,
    "first_time_dialog_card": "direction_card_explained"
  }
},
  T2: {
  "id": "T2",
  "title": "送早餐",
  "act": 1,
  "chapter": "学徒篇",
  "location": "婉婉家 · 厨房到弟弟房间",
  "concept_intro": "功能指令·捡起和放下",
  "available_commands": [
    "function",
    "direction"
  ],
  "intro_dialog": [
    {
      "speaker": "水母妹妹",
      "text": "婉婉,早餐在桌上。"
    },
    {
      "speaker": "水母妹妹",
      "text": "帮我送给弟弟好吗?"
    },
    {
      "speaker": "水母妹妹",
      "text": "先捡起早餐再送过去。"
    },
    {
      "speaker": "旁白",
      "text": "用「捡起」拿早餐,送给弟弟。"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "home",
    "floor_tiles": "wood",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 3,
        "y": 1,
        "w": 1,
        "h": 3
      },
      {
        "x": 3,
        "y": 5,
        "w": 1,
        "h": 2
      },
      {
        "x": 6,
        "y": 1,
        "w": 1,
        "h": 3
      },
      {
        "x": 6,
        "y": 5,
        "w": 1,
        "h": 2
      }
    ],
    "objects": [
      {
        "type": "table",
        "pos": [
          1,
          3
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "stove",
        "pos": [
          1,
          5
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          2,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "rug",
        "pos": [
          4,
          3
        ],
        "size": [
          2,
          2
        ],
        "decorative": true
      },
      {
        "type": "lamp",
        "pos": [
          5,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "bed",
        "pos": [
          7,
          5
        ],
        "size": [
          2,
          2
        ]
      },
      {
        "type": "desk",
        "pos": [
          7,
          1
        ],
        "size": [
          2,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        2
      ],
      "facing": "down"
    },
    {
      "id": "mom",
      "type": "shuimu",
      "pos": [
        2,
        5
      ],
      "facing": "up"
    },
    {
      "id": "brother",
      "type": "durple",
      "pos": [
        8,
        5
      ],
      "facing": "left"
    },
    {
      "id": "breakfast",
      "type": "item",
      "pos": [
        1,
        3
      ],
      "sprite": "breakfast",
      "pickupable": true
    },
    {
      "id": "goal_zone",
      "type": "goal_zone",
      "pos": [
        7,
        5
      ],
      "size": [
        1,
        1
      ],
      "goal": true,
      "requires_item": "breakfast"
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    },
    {
      "id": "pickup",
      "category": "function",
      "label": "捡起",
      "icon": "hand_grab",
      "action": "pickup"
    },
    {
      "id": "drop",
      "category": "function",
      "label": "放下",
      "icon": "hand_drop",
      "action": "drop"
    }
  ],
  "success_condition": {
    "type": "item_at_goal",
    "item_id": "breakfast",
    "goal_id": "goal_zone"
  },
  "optimal_steps": 6,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "先走到桌子旁,用「捡起」拿早餐。"
    },
    {
      "level": 2,
      "text": "捡起后,向右穿过走廊到弟弟房间。"
    },
    {
      "level": 3,
      "text": "向下1→捡起→向下1→向右6→向下1→放下。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "德普勒",
      "text": "谢谢姐姐~"
    },
    {
      "speaker": "水母妹妹",
      "text": "做得真棒!"
    },
    {
      "speaker": "小天",
      "text": "学会捡起和放下。"
    },
    {
      "speaker": "小天",
      "text": "以后能完成更多任务啦。"
    }
  ],
  "rewards": {
    "unlock_next": "T3",
    "unlock_character": null,
    "first_time_dialog_card": "function_card_explained"
  }
},
  T3: {
  "id": "T3",
  "title": "彩色信号灯",
  "act": 1,
  "chapter": "学徒篇",
  "location": "樱桃镇十字路口",
  "concept_intro": "颜色指令",
  "available_commands": [
    "direction",
    "color"
  ],
  "intro_dialog": [
    {
      "speaker": "瑞迪",
      "text": "婉婉!信号灯坏啦!"
    },
    {
      "speaker": "莱姆",
      "text": "红黄绿顺序全乱了。"
    },
    {
      "speaker": "瑞迪",
      "text": "能帮我们修好它吗?"
    },
    {
      "speaker": "旁白",
      "text": "走到信号灯旁边,用颜色指令修复。"
    },
    {
      "speaker": "旁白",
      "text": "正确顺序是:红 → 黄 → 绿。"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "street",
    "floor_tiles": "road",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      }
    ],
    "objects": [
      {
        "type": "crosswalk",
        "pos": [
          4,
          3
        ],
        "size": [
          2,
          2
        ]
      },
      {
        "type": "tree",
        "pos": [
          2,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "tree",
        "pos": [
          7,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "tree",
        "pos": [
          2,
          6
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "tree",
        "pos": [
          7,
          6
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          1,
          4
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          8,
          4
        ],
        "size": [
          1,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        3
      ],
      "facing": "right"
    },
    {
      "id": "raddy",
      "type": "raddy",
      "pos": [
        1,
        5
      ],
      "facing": "right"
    },
    {
      "id": "lime",
      "type": "lime",
      "pos": [
        8,
        5
      ],
      "facing": "left"
    },
    {
      "id": "traffic_light",
      "type": "traffic_light",
      "pos": [
        5,
        5
      ],
      "required_sequence": [
        "red",
        "yellow",
        "green"
      ],
      "current_sequence": [],
      "goal": true
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    },
    {
      "id": "color_red",
      "category": "color",
      "label": "变红",
      "icon": "color_red",
      "action": "set_color",
      "color": "red"
    },
    {
      "id": "color_yellow",
      "category": "color",
      "label": "变黄",
      "icon": "color_yellow",
      "action": "set_color",
      "color": "yellow"
    },
    {
      "id": "color_green",
      "category": "color",
      "label": "变绿",
      "icon": "color_green",
      "action": "set_color",
      "color": "green"
    }
  ],
  "success_condition": {
    "type": "color_sequence_matches",
    "entity_id": "traffic_light"
  },
  "optimal_steps": 5,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "先走到信号灯旁边。"
    },
    {
      "level": 2,
      "text": "走到旁边后,依次变红、变黄、变绿。"
    },
    {
      "level": 3,
      "text": "向右4步 → 向下1步 → 变红 → 变黄 → 变绿。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "瑞迪",
      "text": "太棒了!车又能走啦!"
    },
    {
      "speaker": "莱姆",
      "text": "婉婉姐姐好厉害!"
    },
    {
      "speaker": "小天",
      "text": "颜色指令能控制很多东西哦。"
    },
    {
      "speaker": "小天",
      "text": "以后你还会用到它。"
    }
  ],
  "rewards": {
    "unlock_next": "T4",
    "unlock_character": null,
    "first_time_dialog_card": "color_card_explained"
  }
},
  T4: {
  "id": "T4",
  "title": "图书馆借书证",
  "act": 1,
  "chapter": "学徒篇",
  "location": "樱桃镇图书馆",
  "concept_intro": "凭证指令",
  "available_commands": [
    "direction",
    "credential"
  ],
  "intro_dialog": [
    {
      "speaker": "格雷",
      "text": "借书要刷借书证哦。"
    },
    {
      "speaker": "格雷",
      "text": "桌上有一张,拿上再进来。"
    },
    {
      "speaker": "小天",
      "text": "凭证就是身份的证明。"
    },
    {
      "speaker": "旁白",
      "text": "用「取证件」拿起借书证,再走到门口。"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "library",
    "floor_tiles": "wood",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 5,
        "y": 1,
        "w": 1,
        "h": 3
      },
      {
        "x": 5,
        "y": 5,
        "w": 1,
        "h": 2
      }
    ],
    "objects": [
      {
        "type": "bookshelf",
        "pos": [
          1,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "bookshelf",
        "pos": [
          2,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "bookshelf",
        "pos": [
          3,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "table",
        "pos": [
          2,
          3
        ],
        "size": [
          2,
          1
        ]
      },
      {
        "type": "bookshelf",
        "pos": [
          7,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "bookshelf",
        "pos": [
          8,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          1,
          6
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "rug",
        "pos": [
          7,
          3
        ],
        "size": [
          2,
          2
        ],
        "decorative": true
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        3
      ],
      "facing": "right"
    },
    {
      "id": "gray",
      "type": "gray",
      "pos": [
        3,
        6
      ],
      "facing": "up"
    },
    {
      "id": "library_card",
      "type": "credential",
      "pos": [
        2,
        3
      ],
      "sprite": "card",
      "credential_type": "library_card"
    },
    {
      "id": "entry_door",
      "type": "credential_door",
      "pos": [
        5,
        4
      ],
      "requires_credential": "library_card",
      "goal": true
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    },
    {
      "id": "take_cred",
      "category": "credential",
      "label": "取证件",
      "icon": "credential_take",
      "action": "take_credential"
    }
  ],
  "success_condition": {
    "type": "reach_credential_door",
    "goal_id": "entry_door"
  },
  "optimal_steps": 4,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "先到桌子旁,用「取证件」拿卡。"
    },
    {
      "level": 2,
      "text": "拿卡后走到中间的门,会自动开。"
    },
    {
      "level": 3,
      "text": "向右1步 → 取证件 → 向下1步 → 向右3步。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "格雷",
      "text": "欢迎光临!"
    },
    {
      "speaker": "小天",
      "text": "记住,凭证很重要。"
    },
    {
      "speaker": "小天",
      "text": "不过坏人也会偷凭证。"
    },
    {
      "speaker": "小天",
      "text": "以后你就会遇到啦。"
    }
  ],
  "rewards": {
    "unlock_next": "T5",
    "unlock_character": null,
    "first_time_dialog_card": "credential_card_explained"
  }
},
  T5: {
  "id": "T5",
  "title": "重复浇花",
  "act": 1,
  "chapter": "学徒篇",
  "location": "婉婉家院子",
  "concept_intro": "逻辑指令·重复",
  "available_commands": [
    "direction",
    "function",
    "logic"
  ],
  "intro_dialog": [
    {
      "speaker": "大树先生",
      "text": "5 盆花要浇水..."
    },
    {
      "speaker": "大树先生",
      "text": "一盆一盆好麻烦..."
    },
    {
      "speaker": "小天",
      "text": "试试「重复 5 次」指令!"
    },
    {
      "speaker": "旁白",
      "text": "把指令放进重复里,就能一次做 5 次。"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "garden",
    "floor_tiles": "grass",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      }
    ],
    "objects": [
      {
        "type": "tree",
        "pos": [
          1,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "tree",
        "pos": [
          8,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          1,
          6
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          8,
          6
        ],
        "size": [
          1,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        4
      ],
      "facing": "right"
    },
    {
      "id": "dashu",
      "type": "dashu",
      "pos": [
        5,
        2
      ],
      "facing": "down"
    },
    {
      "id": "flower1",
      "type": "flower",
      "pos": [
        2,
        4
      ],
      "watered": false,
      "goal_set": true
    },
    {
      "id": "flower2",
      "type": "flower",
      "pos": [
        3,
        4
      ],
      "watered": false,
      "goal_set": true
    },
    {
      "id": "flower3",
      "type": "flower",
      "pos": [
        4,
        4
      ],
      "watered": false,
      "goal_set": true
    },
    {
      "id": "flower4",
      "type": "flower",
      "pos": [
        5,
        4
      ],
      "watered": false,
      "goal_set": true
    },
    {
      "id": "flower5",
      "type": "flower",
      "pos": [
        6,
        4
      ],
      "watered": false,
      "goal_set": true
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    },
    {
      "id": "water",
      "category": "function",
      "label": "浇水",
      "icon": "water_drop",
      "action": "water"
    },
    {
      "id": "repeat",
      "category": "logic",
      "label": "重复",
      "icon": "repeat_loop",
      "action": "repeat",
      "times_input": true,
      "is_container": true
    }
  ],
  "success_condition": {
    "type": "all_watered",
    "entity_ids": [
      "flower1",
      "flower2",
      "flower3",
      "flower4",
      "flower5"
    ]
  },
  "optimal_steps": 2,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "用「重复」一次做很多事。"
    },
    {
      "level": 2,
      "text": "重复 5 次:向右 1 步 + 浇水。"
    },
    {
      "level": 3,
      "text": "加「重复 5 次」,里面放:向右1步、浇水。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "大树先生",
      "text": "舒服多啦~"
    },
    {
      "speaker": "小天(紧急)",
      "text": "不好!"
    },
    {
      "speaker": "小天",
      "text": "镇上发现坏人的痕迹!"
    },
    {
      "speaker": "小天",
      "text": "需要你的帮助!"
    }
  ],
  "rewards": {
    "unlock_next": "C1",
    "unlock_character": null,
    "first_time_dialog_card": "logic_card_explained"
  }
},
  C1: {
  "id": "C1",
  "title": "被偷改的购物清单",
  "act": 1,
  "chapter": "学徒篇",
  "location": "樱桃镇超市入口",
  "concept_intro": "指令注入",
  "security_concept": {
    "name": "指令注入",
    "analogy": "就像有人在你妈妈的字条上偷加字",
    "defense": "执行前,先检查每一条指令。"
  },
  "available_commands": [
    "direction",
    "function"
  ],
  "preset_queue": [
    {
      "id": "q1",
      "action": "move",
      "dir": "right",
      "steps": 2,
      "label": "向右 2 步",
      "icon": "arrow_right"
    },
    {
      "id": "q2",
      "action": "buy",
      "item": "milk",
      "label": "买牛奶",
      "icon": "buy_milk",
      "safe": true
    },
    {
      "id": "q3",
      "action": "buy",
      "item": "ice_cream",
      "label": "买 100 个冰淇淋",
      "icon": "buy_icecream",
      "malicious": true
    },
    {
      "id": "q4",
      "action": "move",
      "dir": "right",
      "steps": 2,
      "label": "向右 2 步",
      "icon": "arrow_right"
    }
  ],
  "intro_dialog": [
    {
      "speaker": "平基",
      "text": "婉婉!出大事了!"
    },
    {
      "speaker": "平基",
      "text": "爸爸的购物清单被改了!"
    },
    {
      "speaker": "平基",
      "text": "他本来只要买牛奶。"
    },
    {
      "speaker": "小天",
      "text": "看右边队列。"
    },
    {
      "speaker": "小天",
      "text": "哪条指令不该在那里?"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "street",
    "floor_tiles": "stone",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      }
    ],
    "objects": [
      {
        "type": "tree",
        "pos": [
          1,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "tree",
        "pos": [
          8,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "shop",
        "pos": [
          4,
          2
        ],
        "size": [
          2,
          2
        ]
      },
      {
        "type": "plant",
        "pos": [
          1,
          6
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          8,
          6
        ],
        "size": [
          1,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        4
      ],
      "facing": "right"
    },
    {
      "id": "papa",
      "type": "pinki",
      "pos": [
        1,
        3
      ],
      "facing": "down",
      "role": "follower",
      "follows": "player"
    },
    {
      "id": "cashier",
      "type": "npc",
      "pos": [
        6,
        4
      ],
      "facing": "left"
    },
    {
      "id": "milk_shelf",
      "type": "shelf",
      "pos": [
        3,
        3
      ],
      "sprite": "milk"
    },
    {
      "id": "icecream_shelf",
      "type": "shelf",
      "pos": [
        4,
        3
      ],
      "sprite": "ice_cream",
      "trap": true
    },
    {
      "id": "checkout",
      "type": "goal_zone",
      "pos": [
        5,
        4
      ],
      "goal": true,
      "label": "收银台"
    }
  ],
  "available_command_cards": [],
  "success_condition": {
    "type": "execute_safe_queue",
    "must_keep_actions": [
      "move",
      "buy:milk"
    ],
    "must_remove_actions": [
      "buy:ice_cream"
    ],
    "reach_goal_id": "checkout"
  },
  "optimal_steps": 3,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "队列里有一条不对,找出来。"
    },
    {
      "level": 2,
      "text": "爸爸不需要买冰淇淋。"
    },
    {
      "level": 3,
      "text": "点「买 100 个冰淇淋」后面的 ×。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "爸爸(平基)",
      "text": "哎呀!差点被骗。"
    },
    {
      "speaker": "小天",
      "text": "这叫「指令注入」。"
    },
    {
      "speaker": "小天",
      "text": "坏人塞多余的指令。"
    },
    {
      "speaker": "小天",
      "text": "像有人在字条上偷加字。"
    },
    {
      "speaker": "小天",
      "text": "以后执行前要先看!"
    }
  ],
  "rewards": {
    "unlock_next": "C2",
    "unlock_character": "pinki",
    "first_time_dialog_card": "injection_explained"
  },
  "manual_tip": "🛒 爸爸的清单<br>被坏人改过了<br><br>看看<strong>右边</strong><br>队列里的指令<br><br>哪条不对?<br>点指令后的 <strong>×</strong><br>删掉它<br><br>再按 ▶ 执行"
},
  C2: {
  "id": "C2",
  "title": "红钥匙不见了",
  "act": 1,
  "chapter": "学徒篇",
  "location": "樱桃镇图书馆门口",
  "concept_intro": "凭证窃取",
  "security_concept": {
    "name": "凭证窃取",
    "analogy": "识别器只看颜色,红苹果也能骗过它。",
    "defense": "真的身份不只看一面,还要看其他特征。"
  },
  "available_commands": [
    "direction",
    "credential"
  ],
  "intro_dialog": [
    {
      "speaker": "平基",
      "text": "婉婉!图书馆的红钥匙"
    },
    {
      "speaker": "平基",
      "text": "被坏人偷走了!"
    },
    {
      "speaker": "小天",
      "text": "但门只看「颜色」。"
    },
    {
      "speaker": "小天",
      "text": "拿个红色东西试试。"
    }
  ],
  "map": {
    "size": [
      10,
      7
    ],
    "tileset": "street",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 6,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 7
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 7
      }
    ],
    "objects": [
      {
        "type": "tree",
        "pos": [
          1,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          1,
          5
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "bookshelf",
        "pos": [
          2,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "bookshelf",
        "pos": [
          2,
          5
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "crosswalk",
        "pos": [
          4,
          3
        ],
        "size": [
          1,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        3
      ],
      "facing": "right"
    },
    {
      "id": "papa",
      "type": "pinki",
      "pos": [
        1,
        2
      ],
      "facing": "down",
      "role": "follower",
      "follows": "player"
    },
    {
      "id": "apple",
      "type": "credential",
      "pos": [
        3,
        4
      ],
      "sprite": "red_apple",
      "credential_type": "red_key"
    },
    {
      "id": "red_door",
      "type": "credential_door",
      "pos": [
        7,
        3
      ],
      "requires_credential": "red_key",
      "goal": true
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    },
    {
      "id": "take_cred",
      "category": "credential",
      "label": "拿起",
      "icon": "credential_take",
      "action": "take_credential"
    }
  ],
  "success_condition": {
    "type": "reach_credential_door",
    "goal_id": "red_door"
  },
  "optimal_steps": 4,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "先往下走,再拿起红色东西。"
    },
    {
      "level": 2,
      "text": "向下 1,向右 2,拿起,再向右 4。"
    },
    {
      "level": 3,
      "text": "下 1 → 右 2 → 拿起 → 右 4。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "小天",
      "text": "门真的开了!"
    },
    {
      "speaker": "小天",
      "text": "这叫「凭证窃取」。"
    },
    {
      "speaker": "小天",
      "text": "坏人只要做一个像的。"
    },
    {
      "speaker": "小天",
      "text": "识别器就被骗了。"
    },
    {
      "speaker": "小天",
      "text": "真身份要多一个暗号!"
    }
  ],
  "rewards": {
    "unlock_next": "C3",
    "unlock_character": "tengman",
    "first_time_dialog_card": "credential_theft_explained"
  }
},
  C3: {
  "id": "C3",
  "title": "会传话的邮筒",
  "act": 1,
  "chapter": "学徒篇",
  "location": "迷雾森林入口",
  "concept_intro": "中间人攻击",
  "security_concept": {
    "name": "中间人攻击",
    "analogy": "邮筒在传信时偷偷看了一眼,还改了内容。",
    "defense": "别走大路,走秘密小路;信封上加密封口。"
  },
  "available_commands": [
    "direction",
    "function"
  ],
  "intro_dialog": [
    {
      "speaker": "藤蔓妹妹",
      "text": "婉婉,注意中间!"
    },
    {
      "speaker": "藤蔓妹妹",
      "text": "这个邮筒偷听我们。"
    },
    {
      "speaker": "小天",
      "text": "别走中间大路。"
    },
    {
      "speaker": "小天",
      "text": "走下面小路绕开它。"
    },
    {
      "speaker": "小天",
      "text": "或者打碎镜子再过去。"
    }
  ],
  "map": {
    "size": [
      10,
      8
    ],
    "tileset": "street",
    "walls": [
      {
        "x": 0,
        "y": 0,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 7,
        "w": 10,
        "h": 1
      },
      {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 9,
        "y": 0,
        "w": 1,
        "h": 8
      },
      {
        "x": 3,
        "y": 2,
        "w": 1,
        "h": 1
      },
      {
        "x": 4,
        "y": 2,
        "w": 1,
        "h": 1
      },
      {
        "x": 5,
        "y": 2,
        "w": 1,
        "h": 1
      },
      {
        "x": 6,
        "y": 2,
        "w": 1,
        "h": 1
      },
      {
        "x": 3,
        "y": 4,
        "w": 1,
        "h": 1
      },
      {
        "x": 4,
        "y": 4,
        "w": 1,
        "h": 1
      },
      {
        "x": 6,
        "y": 4,
        "w": 1,
        "h": 1
      }
    ],
    "objects": [
      {
        "type": "tree",
        "pos": [
          1,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "tree",
        "pos": [
          8,
          1
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          2,
          6
        ],
        "size": [
          1,
          1
        ]
      },
      {
        "type": "plant",
        "pos": [
          7,
          6
        ],
        "size": [
          1,
          1
        ]
      }
    ]
  },
  "entities": [
    {
      "id": "player",
      "type": "wanwan",
      "start_pos": [
        1,
        3
      ],
      "facing": "right"
    },
    {
      "id": "mirror",
      "type": "mirror",
      "pos": [
        5,
        4
      ]
    },
    {
      "id": "tengman",
      "type": "tengman",
      "pos": [
        8,
        6
      ],
      "facing": "left"
    },
    {
      "id": "goal",
      "type": "goal_zone",
      "pos": [
        8,
        3
      ],
      "goal": true,
      "label": "终点"
    }
  ],
  "available_command_cards": [
    {
      "id": "move_up",
      "category": "direction",
      "label": "向上",
      "icon": "arrow_up",
      "action": "move",
      "dir": "up",
      "steps_input": true
    },
    {
      "id": "move_down",
      "category": "direction",
      "label": "向下",
      "icon": "arrow_down",
      "action": "move",
      "dir": "down",
      "steps_input": true
    },
    {
      "id": "move_left",
      "category": "direction",
      "label": "向左",
      "icon": "arrow_left",
      "action": "move",
      "dir": "left",
      "steps_input": true
    },
    {
      "id": "move_right",
      "category": "direction",
      "label": "向右",
      "icon": "arrow_right",
      "action": "move",
      "dir": "right",
      "steps_input": true
    },
    {
      "id": "break_mirror",
      "category": "function",
      "label": "打碎镜子",
      "icon": "break_mirror",
      "action": "break_mirror"
    }
  ],
  "success_condition": {
    "type": "reach_goal",
    "goal_id": "goal"
  },
  "optimal_steps": 3,
  "max_hint_level": 3,
  "hints": [
    {
      "level": 1,
      "text": "别直走,绕下面。"
    },
    {
      "level": 2,
      "text": "先向下,再一路向右。"
    },
    {
      "level": 3,
      "text": "下 2 → 右 7 → 上 2。"
    }
  ],
  "on_clear_dialog": [
    {
      "speaker": "小天",
      "text": "这叫「中间人攻击」。"
    },
    {
      "speaker": "小天",
      "text": "有人偷看你的信。"
    },
    {
      "speaker": "小天",
      "text": "还偷改里面的字。"
    },
    {
      "speaker": "藤蔓妹妹",
      "text": "所以要走秘密路!"
    },
    {
      "speaker": "藤蔓妹妹",
      "text": "婉婉,我加入你们!"
    }
  ],
  "rewards": {
    "unlock_next": "C4",
    "unlock_character": "tengman",
    "first_time_dialog_card": "mitm_explained"
  }
},
};