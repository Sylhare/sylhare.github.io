fetch('/assets/data/stats.json')
    .then(res => res.json())
    .then((out) => {
        fillInTable(out);
        printRadar(out);
        printMixed(out);
        printBubble(out);
        printStackedBar(out);
        printDateStacked(out);
        //printPie(out);
    })
    .catch(err => {
        document.getElementById('error-chart').append('⚠️ Charts could not be generated ' + err + ' ⚠️')
        document.getElementById('error-chart').style.display = "block";
    });

function fillInTable(data) {
    document.getElementById('TotalPosts').append(data['totalPosts'])
    document.getElementById('TotalTags').append(data['totalTags'])
    document.getElementById('TotalWords').append(data['totalWords'])
    document.getElementById('AvgWords').append(data['averageWordsPerPost'])
}

function printStackedBar(out) {
    const tagYear = years(out).map(i => i[0])
    const tagPosts = processTags(out, tagYear);

    let dataset = tagPosts.map(item => {
        return {
            label: item[0],
            data: item[1],
            backgroundColor: classic20[item[0]] ?? classic20['grey'],
        }
    });

    new Chart(
        document.getElementById('stacked-bar-js').getContext('2d'),
        stackedBarConfig(tagYear, dataset, 'Tags stacked'));
}

function printDateStacked(out) {
    const yearMonths = years(out).map((item) => ({ year: item[0], months: groupByMonth(item[1]) }));
    const dataset = yearMonths.map(item => {
        return {
            label: item.year,
            data: item.months.map(it => it.value),
            backgroundColor: Blues8[parseInt(item.year) % 8]
        }
    });

    new Chart(
        document.getElementById('stacked-bar-date-js').getContext('2d'),
        stackedBarConfig(MONTH_NUMBERS.map(it => monthToName(it)), dataset, 'Posts stacked'));
}

function stackedBarConfig(dates, dataset, title) {
    return {
        type: 'bar',
        data: {
            labels: dates,
            datasets: dataset
        },
        options: {
            aspectRatio: 1,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: true,
                    position: 'right',
                },
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    ticks: { beginAtZero: true },
                    stacked: true
                }
            }
        }
    };
}

function printBubble(out) {
    const dataset = years(out).map((item) => {
        return {
            x: item[0],
            y: item[1].length,
            r: item[1].map(p => Math.floor(parseInt(p.words) / 500)).reduce((a, b) => a + b)
        }
    });

    new Chart(
        document.getElementById('bubble-js').getContext('2d'),
        bubbleConfig(bubbleData(dataset)));
}

function bubbleData(dataset) {
    return {
        datasets: [{
            label: 'Posts number / year / size',
            data: dataset,
            backgroundColor: 'rgb(255, 99, 132)'
        }]
    };
}

function bubbleConfig(data) {
    return {
        type: 'bubble',
        data: data,
        options: {
            aspectRatio: 1.30,
            plugins: {
                legend: { position: 'bottom', },
            },
            scale: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 5 }
                },
            },
        }
    };
}

function printMixed(out) {
    const yearPosts = years(out).map((item) => ({ date: item[0], posts: item[1].length }));

    new Chart(
        document.getElementById('mixed-js').getContext('2d'),
        mixedConfig(mixedData(yearPosts))
    );
}

function mixedData(yearPosts) {
    let sum;
    return {
        labels: yearPosts.map(d => d.date),
        datasets: [{
            type: 'line',
            label: 'Total Articles',
            data: yearPosts.map(elem => sum = (sum || 0) + elem.posts), // cumulative sum of posts
            yAxisID: 'total',
            fill: false,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }, {
            type: 'bar',
            label: 'Articles per year',
            yAxisID: 'per-year',
            data: yearPosts.map(d => d.posts),
            borderColor: 'rgb(255, 205, 86)',
            backgroundColor: 'rgba(255, 205, 86, 0.5)'
        }]
    };
}

function mixedConfig(data) {
    return {
        type: 'scatter',
        data: data,
        options: {
            aspectRatio: 1.30,
            scales: {
                'total': {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true
                },
                'per-year': {
                    type: 'linear',
                    position: 'left',
                }
            }
        }
    };
}

function printRadar(out) {
    new Chart(
        document.getElementById('radar-js').getContext('2d'),
        radarConfig(radarData(postsPerTag(tags(out))))
    );
}

function radarData(postsPerTag) {
    return {
        labels: postsPerTag.labels,
        datasets: [{
            label: 'Articles per tag',
            data: postsPerTag.size,
            fill: true,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            pointBackgroundColor: 'rgb(54, 162, 235)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(54, 162, 235)'
        }]
    }
}

function radarConfig(data) {
    return {
        type: 'radar',
        data: data,
        options: {
            scale: { min: 0 },
            elements: {
                line: { borderWidth: 3 }
            }
        },
    }
}

function printPie(out) {
    new Chart(
        document.getElementById('pie-js').getContext('2d'),
        pieData(postsPerTag(tags(out)))
    );
}

function pieData(postsPerTag) {
    return {
        type: 'doughnut',
        data: {
            labels: postsPerTag.labels,
            datasets: [{
                label: 'Articles per tag',
                data: postsPerTag.size,
                backgroundColor: postsPerTag.labels.map(o => colors[o] ?? getRandomColorHex()),
            }]
        }
    };
}


const processTags = (out, tagYear) => tags(out).sort()
    .reduce((acc, current) => reducePostsPerTagPerYear(current, tagYear, acc), [])
    .sort((a, b) => (b[0] === 'other') - (a[0] === 'other'));

function reducePostsPerTagPerYear(current, tagYear, acc) {
    const tagName = processTagName(current)
    const tagPosts = processTagPosts(current, tagYear);
    const existingTag = acc.find(i => i[0] === tagName)

    if (existingTag) {
        existingTag[1] = existingTag[1].map((val, i) => val + tagPosts[i]);
    } else {
        acc.push([tagName, tagPosts])
    }
    return acc;
}

const processTagName = (current) => {
    if (current[1].length <= 3 || current[0] === 'misc') current[0] = 'other';
    return current[0]
}

const processTagPosts = (current, tagYear) => {
    current[1] = Object.entries(reduceDate(current[1], -6))
    return tagYear.map(date =>
        current[1].reduce((sum, post) => sum + (post[0] === date ? post[1].length : 0), 0)
    )
}

const postsPerTag = (tags) => {
    return {
        labels: tags.map(item => item[0]),
        size: tags.map(item => item[1].length)
    }
}

const tags = (data) => Object.entries(data['posts'].reduce((result, item) => ({
    ...result,
    [item.tags]: [...(result[item.tags] || []), item]
}), {}));

const years = (out) => Object.entries(reduceDate(out['posts'], -6));

const reduceDate = (data, amount) => data.reduce((result, item) => ({
    ...result,
    [item.date.slice(0, amount)]: [...(result[item.date.slice(0, amount)] || []), item]
}), {});

const getRandomColorHex = () => {
    let hex = '0123456789ABCDEF', color = '#';
    for (let i = 1; i <= 6; i++) {
        color += hex[Math.floor(Math.random() * 16)];
    }
    return color;
}

const groupByMonth = (dates) => {
    let months = dates.map(it => it.date.slice(5, 7))
    return MONTH_NUMBERS.map(it => {
        return {
            month: it,
            value: months.filter(m => m === it).length
        }
    })
}

const monthToName = (monthNumber) => new Date(2021, parseInt(monthNumber) - 1, 27).toLocaleString('default', { month: 'short' })

const MONTH_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const colors = {
    'agile': 'rgba(107, 91, 149, 0.85)',
    'linux': 'rgba(255,  99,  132, 0.85)',
    'excel': 'rgba(0,  110,  81, 0.85)',
    'java': 'rgba(249,  103,  20, 0.85)',
    'git': 'rgba(216, 174, 71, 0.85)',
    'jekyll': 'rgba(187,  10,  30, 0.85)',
    'math': 'rgba(0, 155, 119, 0.85)',
    'ruby': 'rgba(157,  50,  50, 0.85)',
    'python': 'rgba(0,  83,  156, 0.85)',
    'ctf': 'rgba(42, 41, 62, 0.85)',
    'database': 'rgba(100,  100,  100, 0.85)',
    'misc': 'rgba(50, 50, 50, 0.85)',
    'open source': 'rgba(181, 223, 214, 0.85)',
    'js': 'rgba(239,  192,  80, 0.85)',
    'docker': 'rgba(63, 105, 170, 0.85)',
    'kubernetes': 'rgba(13, 183, 237, 0.85)',
    'kotlin': 'rgba(247,  120,  107, 0.85)',
    'kafka': 'rgba(147,  85,  41, 0.85)',
    'css': 'rgba(183,  107,  163, 0.85)',
}

const classic20 = {
    'js': '#1f77b4',
    'database': '#aec7e8',
    'java': '#ff7f0e',
    'agile': '#ffbb78',
    'excel': '#2ca02c',
    'python': '#98df8a',
    'jekyll': '#d62728',
    'math': '#ff9896',
    'linux': '#9467bd',
    '-------': '#c5b0d5',
    '-----': '#8c564b',
    '---': '#c49c94',
    'kotlin': '#e377c2',
    'git': '#f7b6d2',
    '-': '#7f7f7f',
    'grey': '#c7c7c7',  // css, ruby, open source, docker, misc
    'ctf': '#bcbd22',
    '----': '#dbdb8d',
    'kubernetes': '#17becf',
    '------': '#9edae5'
};

const Blues8 = ['#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];


/**
 *
 * Using js method to get postsPerCategory and postsPerTag
 * instead of liquid way (takes more time at each build of the static site)
 *

 "postsPerCategory": [
 {% for category in site.categories %}
 {% assign cat = category[0] %}
 {% unless forloop.first %},{% endunless %}
 { "name": "{{cat}}", "size":{{site.categories[cat].size}} }
 {% endfor %}
 ],
 "postsPerTag": [
 {% for tag in site.tags %}
 {% assign tagName = tag[0] %}
 {% unless forloop.first %},{% endunless %}
 { "name": "{{tagName}}", "size":{{site.tags[tagName].size}} }
 {% endfor %}
 ]

 */
