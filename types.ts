export enum ElementType {
    BASMALA = 'BASMALA',
    SCENE_HEADING = 'SCENE_HEADING',
    ACTION = 'ACTION',
    CHARACTER = 'CHARACTER',
    DIALOGUE = 'DIALOGUE',
    PARENTHETICAL = 'PARENTHETICAL',
    TRANSITION = 'TRANSITION'
}

export interface ScreenplayElement {
    type: ElementType;
    text?: string;
    scene_number?: string;
    scene_time?: string;
    scene_location?: string;
}

declare module 'mammoth/mammoth.browser' {
  const mammoth: any;
  export = mammoth;
}