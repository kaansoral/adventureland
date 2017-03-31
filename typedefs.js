/**
 * Created by nexus on 24/03/17.
 */

/**
 * @typedef {Object} ChannelingConditions
 * @property {boolean} town          - Using the town teleportation skill
 */

/**
 * @typedef {Object} StatusConditions //TODO: describe how status effect affect the character
 * @property {boolean} stunned       -
 * @property {boolean} cursed        -
 * @property {boolean} poisoned      -
 * @property {boolean} poisonous     -
 * @property {boolean} charging      -
 * @property {boolean} invis         -
 * @property {boolean} invincible    -
 * @property {boolean} mute          -
 */

/**
 * @typedef {Object} Consumables
 * @property {string} name              - Item name
 * @property {number} q                 - quantity
 */

/**
 * @typedef {Object} Gear
 * @property {string} name              - Item name
 * @property {number} level             - level of item
 * @property {string} [stat_type]       - stat type
 */

/**
 * @typedef {Object} CharacterStats //TODO: describe how character stats effect affect the character
 * @property {number}  dex
 * @property {number}  int
 * @property {number}  vit
 * @property {number}  str
 */

/**
 * @typedef {Object} CharacterSlots
 * @property {Gear} ring1
 * @property {Gear} ring2
 * @property {Gear} earring1
 * @property {Gear} earring2
 * @property {Gear} belt
 * @property {Gear} offhand
 * @property {Gear} chest
 * @property {Gear} pants
 * @property {Gear} shoes
 * @property {Gear} gloves
 * @property {Gear} amulet
 * @property {Gear} orb
 * @property {Gear} elixir
 * @property {Gear} cape
 * @property {Gear} mainhand
 * @property {Gear} helmet
 */

/**
 * @typedef {Object} Map
 * @property {string} name  - A Human readable name
 * @property {number} on_death
 * @property {Array.<Object>} monsters
 * @property {Object} compound
 * @property {Object} data
 * @property {Array.<Array>} doors
 * @property {number} drop_norm
 * @property {Object} exchange
 * @property {Object} items
 * @property {string} key
 * @property {Array.<Object>} merchants
 * @property {Array.<Object>} monsters
 * @property {Array.<Object>} npcs
 * @property {Array.<Array>} quirks
 * @property {Object} ref
 * @property {Array.<number>} u_mid
 * @property {Array.<number>} c_mid
 * @property {Array.<Array>} spawns
 * @property {Object} transporter
 * @property {Object} upgrade
 */

/**
 * @class Character
 * @extends PIXI.Sprite
 * @description Characters extend the Entity Object, so every attribute from Entity is available. Some of the Character attributes are only accessible when you are controlling the character.
 * @property {number}  hp                - health points
 * @property {number}  max_hp            - maximum health points
 * @property {number}  mp                - mana points
 * @property {number}  max_hp            - maximum mana points
 * @property {number}  xp                - current experience points
 * @property {number}  max_xp            - total experience points needed for next level
 * @property {string}  name              - entity name (for monsters it is null)
 * @property {number}  angle             - angle the character is looking at.
 * @property {number}  real_x            - x position on map
 * @property {number}  real_y            - y position on map
 * @property {number|undefined}  from_x  - the last movement starting x position of the character
 * @property {number|undefined}  from_y  - the last movement starting y position of the character
 * @property {number|undefined}  going_x - the last target x position of the character
 * @property {number|undefined}  going_y - the last target y position of the character
 * @property {number}  level             - character level
 * @property {string}  owner             - character owner //TODO need clarification
 * @property {number}  mp_cost           - mana cost for basic attack
 * @property {number}  range             - range for basic attack
 * @property {number}  resistance        - the character damage resistance
 * @property {number}  ref_speed         - walking speed
 * @property {number}  attack            - roughly estimated amount of damage
 * @property {boolean} afk               - is the character afk
 * @property {Array}   items             -
 * @property {number}  gold              - the amount of gold the character carrying
 * @property {boolean} moving            - is character moving
 * @property {boolean} afk               - player is afk
 * @property {boolean} rip               - is the character dead
 * @property {number|undefined} code     - the code id the character is running (0 or undefined means he isn't running code)
 * @property {string}  target            - EntityId
 * @property {string}  type              - the type of the Entity
 * @property {string}  ctype             - class of the character
 * @property {number}  frequency         - frequency in which the character attacks. A frequency of 1 means every second where as 0.5 means every 2 seconds.
 * @property {number}  speed             - walking speed
 * @property {number}  armor             - character armor
 * @property {string}  id                -
 * @property {string}  in                - current map name
 * @property {number}  cid               -
 * @property {Array}   slots             -
 * @property {CharacterStats} stats      - dex,int,vit,str
 * @property {number}  goldm             - Gold modifier
 * @property {number}  luckm             - Luck modifier
 * @property {number}  xpm               - Experience modifier
 * @property {string}  map               - current map name
 * @property {number}  cash              - number of shells
 * @property {number}  targets           - How many Entities are targeting this character
 * @property {string}  ipass             - Authentication token from game server
 * @property {Array.<string>}  friends   - List of Player Ids which whom the player is friends with
 * @property {number} direction          - Direction in shich the character is looking (0:down,1:left,2:right;3:up)
 * @property {Array.<Consumables|Gear>} items   -
 * @property {CharacterSlots} slots      -
 * @property {string} skin               - Character skin
 * @property {string} guild              - Character guild (Currently unimplemented)
 * @property {number} isize              - Inventory size
 * @property {number} esize              - Empty Inventory slots
 * @property {boolean} me                - Is this character me
 * @property {ChannelingConditions} c    - Channelling conditions
 * @property {StatusConditions} s        - Status conditions
 */

/**
 * @class Monster
 * @extends PIXI.Sprite
 * @description All Monsters have these properties
 * @property {number}  hp                - health points
 * @property {number}  max_hp            - maximum health points
 * @property {number}  mp                - mana points
 * @property {number}  max_hp            - maximum mana points
 * @property {number}  xp                - current experience points
 * @property {number}  max_xp            - total experience points needed for next level
 * @property {string}  name              - entity name (for monsters it is null)
 * @property {number}  angle             - angle the character is looking at.
 * @property {number}  real_x            - x position on map
 * @property {number}  real_y            - y position on map
 * @property {number|undefined}  from_x  - the last movement starting x position of the character
 * @property {number|undefined}  from_y  - the last movement starting y position of the character
 * @property {number|undefined}  going_x - the last target x position of the character
 * @property {number|undefined}  going_y - the last target y position of the character
 */

/**
 * @class Player
 * @extends PIXI.Sprite
 * @description All players have these properties
 * @property {number}  hp                - health points
 * @property {number}  max_hp            - maximum health points
 * @property {number}  mp                - mana points
 * @property {number}  max_hp            - maximum mana points
 * @property {number}  xp                - current experience points
 * @property {number}  max_xp            - total experience points needed for next level
 * @property {string}  name              - entity name (for monsters it is null)
 * @property {number}  angle             - angle the character is looking at.
 * @property {number}  real_x            - x position on map
 * @property {number}  real_y            - y position on map
 * @property {number|undefined}  from_x  - the last movement starting x position of the character
 * @property {number|undefined}  from_y  - the last movement starting y position of the character
 * @property {number|undefined}  going_x - the last target x position of the character
 * @property {number|undefined}  going_y - the last target y position of the character
 * @property {string}  type              - the type of the Entity always character
 * @property {number}  level             - character level
 * @property {string}  owner             - player owner //TODO need clarification
 * @property {number}  range             - range for basic attack
 * @property {number}  resistance        - the character damage resistance
 * @property {number}  ref_speed         - walking speed
 * @property {number}  attack            - roughly estimated amount of damage
 * @property {boolean} afk               - is the character afk
 * @property {boolean} moving            - is character moving
 * @property {boolean} afk               - player is afk
 * @property {boolean} rip               - is the character dead
 * @property {number|undefined} code     - the code id the character is running (0 or undefined means he isn't running code)
 * @property {string}  target            - EntityId
 * @property {string}  type              - the type of the Entity (This is equal to "character" for OtherCharacter and Character)
 * @property {string}  ctype             - class of the character
 */

/**
 * @typedef {Object} ItemStats
 * @property {number} apiercing
 * @property {number} armor
 * @property {number} attack
 * @property {number} attr0
 * @property {number} attr1
 * @property {number} crit
 * @property {number} dex
 * @property {number} dreturn
 * @property {number} evasion
 * @property {number} gold
 * @property {number} hp
 * @property {number} int
 * @property {number} level
 * @property {number} lifesteal
 * @property {number} mp
 * @property {number} range
 * @property {number} reflection
 * @property {number} resistance
 * @property {number} rpiercing
 * @property {number} speed
 * @property {number} stat
 * @property {number} str
 * @property {number} vit
 */

/**
 *
 * @class PIXI.Sprite
 * @desc PIXI sprite Object se documentation here {@link http://pixijs.download/release/docs/PIXI.Sprite.html}
 * @see http://pixijs.download/dev/docs/PIXI.Sprite.html
 * @property {number} alpha
 * @property {PIXI.ObservablePoint} anchor
 * @property {number} blendMode
 * @property {boolean} cacheAsBitmap
 * @property {Array.<PIXI.DisplayObject>} children
 * @property {PIXI.Rectangle} filterArea
 * @property {Array.<PIXI.Filter>} filters
 * @property {number} height
 * @property {PIXI.Matrix} localTransform
 * @property {PIXI.Graphics|PIXI.Sprite} mask
 * @property {PIXI.Container} parent
 * @property {PIXI.Point|PIXI.ObservablePoint} pivot
 * @property {string} pluginName
 * @property {PIXI.Point|PIXI.ObservablePoint} position
 * @property {boolean} renderable
 * @property {number} rotation
 * @property {PIXI.Point|PIXI.ObservablePoint} scale
 * @property {PIXI.Filter|PIXI.Shader} shader
 * @property {PIXI.ObservablePoint} skew
 * @property {PIXI.Texture} texture
 * @property {number} tint
 * @property {PIXI.TransformBase} transform
 * @property {boolean} visible
 * @property {number} width
 * @property {number} worldAlpha
 * @property {PIXI.Matrix} worldTransform
 * @property {boolean} worldVisible
 * @property {number} x
 * @property {number} y
 *
 */

