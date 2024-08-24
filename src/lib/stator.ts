export class ToeStator {
  board: Board

  getBoxById(id: string): Promise<Box> {
    return new Promise(async (resolve, reject) => {
      await findBoxById(this.board, resolve, id);
      reject;
    })
  }
  
  async checkBoxById(id: string, player: string) {
    let box = await this.getBoxById(id);
    switch (box.type) {
      case "check":
        box.claimedBy = player;
        break;
      default:
        break;
    }
  }
  
  async digAtBoxId(id: string) {
    let box = await this.getBoxById(id);
    if (box.type === "board") {
      throw new Error("can't dig at an existing board");
    }
    box.type = "board";
    
  }

  constructor(public allowDig: boolean, spec: BoardSpec) {
    this.board = makeRootBoardFromSpec(spec);
  }
}

async function findBoxById(box: Box, cb: (box: Box) => void, id: string) {
  if(box.id === id){
    cb(box)
  } else{
    if(box.type == "board" && box.spots){
      box.spots.forEach(async row => {
        row.forEach(async (column) => {
          await findBoxById(column, cb, id)
        })
      });
    }
  }
};


function makeRootBoardFromSpec(spec: BoardSpec): Board {
  if (!Array.isArray(spec)) {
    return {
      id: crypto.randomUUID(),
      length: 1,
      spots: [
        [
          {
            type: "check",
            claimedBy: null,
            id: crypto.randomUUID()
          }
        ]
      ],
      type: "board"
    }
  }
  return {
    type: "board",
    spots: spec.map((specRow) => { return specRow.map((specCol)=> {
      return makeBoxFromSpec(specCol)
    })}),
    length: spec.length,
    id: crypto.randomUUID()
  }
}

function makeBoxFromSpec(spec: BoardSpec): Box {
  if (!Array.isArray(spec)) {
    return {
      type: "check",
      id: crypto.randomUUID(),
      // is claimable? not claimed. isn't? claimed by system.
      claimedBy: spec ? null : "system"
    }
  }
  return {
    type: "board",
    id: crypto.randomUUID(),
    length: spec.length,
    spots: spec.map((specsInCol) => {
      return specsInCol.map((specsInRow) => {
        return makeBoxFromSpec(specsInRow)
      })
    })
  }
}

/**
  key: id, value: parents path
*/
export type BoardIdx = Map<string, string>;

/**
  2d grid at each level
*/
export type BoardSpec = boolean | Array<Array<boolean | BoardSpec>>;

export interface Board {
  type: "board";
  spots: Array<Array<Box>>;
  length: number;
  id: string;
}

export type Box = CheckBox | Board;

export interface CheckBox {
  type: "check";
  /**
    if claimed by "system" then it can't be checked at all
  */
  claimedBy: string | null;
  id: string;
}
