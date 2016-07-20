# Hollywood Age Gap

An informational site showing the age gap between movie love interests.

## Data

You can download a CSV of the site's data here: [hollywoodagegap.com/movies.csv](http://hollywoodagegap.com/movies.csv)

If you use the data somewhere else, a link back to hollywoodagegap.com would be appreciated!

## Contribute

There's a lot of movies in the world, so the one you're looking for might be missing. If you'd like to see a movie added to the site, please contribute.

### Guidelines

Any movie can be added if it follows these rules:

- The two (or more) actors play actual love interests (not just friends, coworkers, or some other non-romantic type of relationship)
- The youngest of the two actors is at least 17 years old
- Not animated characters

### Tweet

If you don't want to deal with the codebase, you can tweet suggestions to [@lynnandtonic](https://twitter.com/lynnantonic).

### Submit an issue

[Submit a GitHub issue](https://github.com/lynnandtonic/hollywood-age-gap/issues) with the movie and actors you'd like to add.

Please include the release year for the movie and each actor's birthdate.

### Contribute to the codebase

Actor and movie data are stored in JSON files.

#### Add actors

First check to see if the actors you are referencing are in `data/actors`.

If you need to add an actor, create a `.json` file with the actor's first and last name, gender (man/woman), and birthday (YYYY-MM-DD):

```
{
  "name": "Jane Doe",
  "gender": "woman",
  "born": "1975-12-30"
}
```

Name the file with the actor's name, using underscores between words or in place of hyphens (all lowercase): `jane_doe.json` and save it to `data/actors`.

#### Add movies

Create the movie `.json` file in `data/movies` with the movie title, year released, and actor names:

```
{
    "name": "A Great Movie",
    "year": 2016,
    "relationships": [
        ["John Smith", "Jane Doe"]
    ]
}
```

Name the file with the movie title and year, using underscores between words or in place of hyphens (all lowercase): `a_great_movie_2016.json` and save it to `data/movies`.

If a movie has more than one couple, you can add those in the same movie file.

```
    "relationships": [
        ["John Smith", "Jane Doe"],
        ["George Glass", "Sarah Connor"]
    ]
```

If the relationship is a man/woman couple, please put the man's name first. If it's a same-gender couple, any order is fine.


## To build the site locally:

```
npm install
npm run dev
```

Navigate to `localhost:3456`

### Editing templates

Template content is written in Jade templates which produce the site HTML.

The Jade files are located in `/src/views/templates`.

Note that these aren't markdown files and the syntax and whitespace you use does matter quite a bit. See the [Jade documentation](http://jade-lang.com) to see how to use Jade.

### Editing CSS

This site uses [Stylus for preprocessing](http://learnboost.github.io/stylus/). Please follow the established indentation and commenting patterns.

Stylus files are located in `/assets`.

### Declaration Order

Please use the following loose declaration order:

* Box-model properties
* Display and Positioning
* Backgrounds
* Borders
* Box Shadows
* Fonts and Colors
* Other

