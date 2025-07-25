export default {
    "lexicon": 1,
    "id": "com.whtwnd.blog.entry",
    "defs": {
        "main": {
            "type": "record",
            "description": "A declaration of a post.",
            "key": "tid",
            "record": {
                "type": "object",
                "required": [
                    "content"
                ],
                "properties": {
                    "content": {
                        "type": "string",
                        "maxLength": 100000
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "datetime"
                    },
                    "title": {
                        "type": "string",
                        "maxLength": 1000
                    },
                    "subtitle": {
                        "type": "string",
                        "maxLength": 1000
                    },
                    "ogp": {
                        "type": "ref",
                        "ref": "com.whtwnd.blog.defs#ogp"
                    },
                    "theme": {
                        "type": "string",
                        "enum": [
                            "github-light"
                        ]
                    },
                    "blobs": {
                        "type": "array",
                        "items": {
                            "type": "ref",
                            "ref": "com.whtwnd.blog.defs#blobMetadata"
                        }
                    },
                    "isDraft": {
                        "type": "boolean",
                        "description": "(DEPRECATED) Marks this entry as draft to tell AppViews not to show it to anyone except for the author"
                    },
                    "visibility": {
                        "type": "string",
                        "enum": [
                            "public",
                            "url",
                            "author"
                        ],
                        "default": "public",
                        "description": "Tells the visibility of the article to AppView."
                    }
                }
            }
        }
    }
} as const;