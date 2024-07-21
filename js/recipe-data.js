// recipeData.js
const recipes = [
    /* appetizers */ 

    /* main- courses */
    {
        id: 201,
        name: "מוקפץ עם סלמון וברוקולי",
        category: "main-courses",
        cookingTime: 30,
        difficulty: "קלה",
        mainIngredient: "דג",
        image: "stir-fried-noodles-with-salmon.jpg",
        tags: ["סלמון", "ברוקולי", "שעועית ירוקה","פסטה"],
        // New fields
        servings: 4,
        ingredients: [
            { item: "פילה סלמון", amount: 500, unit: "גרם" },
            { item: "ברוקולי", amount: 1, unit: "ראש" },
            { item: "שעועית ירוקה", amount: 200, unit: "גרם" },
            { item: "פסטה", amount: 250, unit: "גרם" },
            { item: "שמן זית", amount: 2, unit: "כפות" },
            { item: "שום", amount: 2, unit: "שיניים" },
            { item: "מלח", amount: 1, unit: "כפית" },
            { item: "פלפל שחור", amount: 0.5, unit: "כפית" }
        ],
        instructions: [
            "הרתיחו מים במיחם גדול והוסיפו מלח. בשלו את הפסטה לפי הוראות היצרן עד שהיא אל דנטה.",
            "בינתיים, חתכו את הסלמון לקוביות בגודל ביס. חתכו את הברוקולי לפרחים קטנים ואת השעועית הירוקה לחתיכות באורך 5 ס\"מ.",
            "חממו שמן זית במחבת גדולה או ווק על אש גבוהה. הוסיפו את השום הכתוש וטגנו במשך 30 שניות עד שמשחים.",
            "הוסיפו את קוביות הסלמון וטגנו במשך 2-3 דקות עד שהן משחימות מעט מכל הצדדים.",
            "הוסיפו את הברוקולי והשעועית הירוקה וטגנו במשך 3-4 דקות נוספות עד שהירקות מתרככים אך עדיין פריכים.",
            "הוסיפו את הפסטה המבושלת למחבת ובחשו היטב. תבלו במלח ופלפל לפי הטעם.",
            "הגישו חם."
        ]
    },

    { id: 202, name: "בולונז", category: "main-courses", cookingTime: 90, difficulty: "בינונית",
        mainIngredient: "בשר", image: "bolognese.jpg", tags: ["בשר טחון", "גזר"] },

    { id: 203, name: "קציצות", category: "main-courses", cookingTime: 20, difficulty: "קלה",
        mainIngredient: "בשר", image: "patties.jpeg", tags: ["בשר טחון"] },

    { id: 204, name: "פסטה עם חזה עוף", category: "main-courses", cookingTime: 30, difficulty: "קלה",
        mainIngredient: "עוף", image: "pasta-with-chickecn-breasts.jpg", tags: ["עוף", "פסטה","ברוקולי", "קלמטה", "ארטישוק"] },

    { id: 205, name: "חזה עוף בפפריקה", category: "main-courses", cookingTime: 20, difficulty: "קלה",
        mainIngredient: "עוף", image: "chicken-breasts-with-paprika.jpg", tags: ["עוף", "פפריקה"] },

    { id: 206, name: "שניצלים", category: "main-courses", cookingTime: 30, difficulty: "קלה",
        mainIngredient: "עוף", image: "shnitzel.jpeg", tags: ["עוף", "פירורי לחם"] },

    /* sides */
    { id: 301, name: "אורז עם שעועית וגזר", category: "side-dishes", cookingTime: 90, difficulty: "בינונית",
        mainIngredient: "אורז", image: "rice-with-green-beans-and-carrots.jpg", tags: ["אורז", "שעועית", "גזר"] },

    { id: 302, name: "אורז לבן פרסי", category: "side-dishes", cookingTime: 90, difficulty: "בינונית",
        mainIngredient: "אורז", image: "white-rice.jpg", tags: ["אורז"] },

    { id: 303, name: "פתיתים", category: "side-dishes", cookingTime: 15, difficulty: "קלה",
        mainIngredient: "פתיתים", image: "israeli-couscous.jpeg", tags: ["פתיתים", "תיבולית"] },

    { id: 304, name: "מג'דרה", category: "side-dishes", cookingTime: 75, difficulty: "בינונית",
        mainIngredient: "אורז", image: "majadra.jpg", tags: ["אורז", "עדשים ירוקות"] },

    /* 4 - soups and stews */

    /* 5 - salads */

    /* 6 - desserts */
    { id: 601, name: "בראוניז", category: "desserts", cookingTime: 70, difficulty: "קלה",
        mainIngredient: "שוקולד", image: "brownies.jpg", tags: ["שוקולד"] },

    { id: 602, name: "הקרם ברולה של רותם", category: "desserts", cookingTime: 45, difficulty: "קלה",
        mainIngredient: "שמנת מתוקה", image: "creme-brule.jpg", tags: ["שמנת מתוקה", "סוכר"] },

    /* 7 - breakfast and brunch */

    /* 8 - snacks */

    /* 9 - beverages */
    
    
    // Add more recipe objects as needed


];
