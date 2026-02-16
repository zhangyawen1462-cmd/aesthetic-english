// ============================================================
// Notion 字段名称配置
// ============================================================

export const NOTION_FIELDS = {
  LESSON: {
    ID: 'title',               // Title 类型（Notion API 固定使用 'title'）
    TITLE_EN: 'Title_EN',      // Text 类型
    TITLE_CN: 'Title_CN',      // Text 类型
    CATEGORY: 'Category',      // Select 类型
    EP: 'EP',                  // Text 类型（不是 Number！）
    STATUS: 'Status',          // Select 类型
    DATE: 'Date',              // Date 类型
    COVER_IMG: 'Cover_Img',    // URL 类型
    COVER_IMG_16X9: 'Cover_Img_16x9',  // URL 类型
    VIDEO_URL: 'Video_URL',    // URL 类型
    SRT_RAW: 'SRT_Raw',        // Text 类型
    CONTENT_TYPE: 'Content_Type',      // Select 类型
    DISPLAY_POSITION: 'Display_Position',  // Select 类型
    SORT_ORDER: 'Sort_Order',  // Number 类型
    COVER_RATIO: 'Cover_Ratio', // Select 类型
  },
  VOCABULARY: {
    WORD: 'Word',
    PHONETIC: 'Phonetic',
    DEFINITION: 'Definition',
    DEFINITION_CN: 'Definition_CN',
    EXAMPLE: 'Example',
    SOURCE: 'Source',
    LESSON: 'Lesson',          // Relation 类型（实际字段名是 Lesson）
  },
  GRAMMAR: {
    POINT: 'Point',
    DESCRIPTION: 'Description',
    EXAMPLE: 'Example',
    LESSON: 'Lesson',          // Relation 类型（实际字段名是 Lesson）
  },
  RECALL: {
    TEXT_CN: 'Text_CN',
    TEXT_EN: 'Text_EN',
    LESSON: 'Lesson',          // Relation 类型（实际字段名是 Lesson）
  },
};
