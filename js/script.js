var width = 960,
    height = 500;

var rows = 10,
    cols = 20;

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var centerScale = d3.scalePoint().padding(1).range([0, width]);
var forceStrength = 0.05;

var parties = _.uniq(elec_results.map(function (d) {
    return d.party;
}))
party_dims = {}
for (var i = 0; i < parties.length; i++) {
    party_dims[parties[i]] = { x: 10, y: (i) * 50 }
}
console.log(party_dims)
drawMap(map_obj)

function circlePath(x, y, radius) {
    var l = `${x - radius},${y}`,
        r = `${x + radius},${y}`,
        pre = `A${radius},${radius},0,1,1`;
    return `M${l}${pre},${r}${pre},${l}Z`;
}

function filter_obj(obj_arr, key, value) {
    return obj_arr.filter(function (res) {
        return res[key] === value
    });
}

function drawMap(map) {
    var feature = topojson.feature(map, map.objects.RAJ_AC);

    var proj = d3.geoEquirectangular()
        .fitSize([width, height], feature);
    var geoPath = d3.geoPath().projection(proj);

    var path = svg.selectAll("path.const")
        .data(feature.features)
        .enter().append("path")
        .attr("class", "const")
        .attr('party-name', function (d) {
            return filter_obj(elec_results, 'constituency', d.properties.AC_NAME)[0].party
        })
        .style("fill", function (d) {
            return filter_obj(elec_results, 'constituency', d.properties.AC_NAME)[0].color
        })
        .attr("d", function (d) {
            return geoPath(d);
        });

    function get_coords(prop_key, i) {
        party_dim = party_dims[filter_obj(elec_results, 'constituency', prop_key)[0].party]
        // x = (1 + (i % cols)) * (width / cols)
        // y = (Math.floor(i / cols) + 1) * (height / rows)
        x = party_dim.x * (i)
        y = party_dim.y
    }

    var inward = feature.features.map(function (d, i) {
        get_coords(d.properties.AC_NAME, i)
        return flubber.combine(flubber.splitPathString(geoPath(d)),
            circlePath(x, y, 15),
            { single: true });
    });

    var outward = feature.features.map(function (d, i) {
        get_coords(d.properties.AC_NAME, i)
        return flubber.separate(circlePath(x, y, 15),
            flubber.splitPathString(geoPath(d)),
            { single: true });
    });


    d3.select("#show_circles").on("click", function () {
        path
            .transition().delay(500).duration(3000)
            .attrTween("d", function (d, i) {
                return inward[i];
            })

    })
    d3.select("#show_map").on("click", function () {
        path
            .transition().delay(500).duration(3000)
            .attrTween("d", function (d, i) {
                return outward[i];
            })
    })

}
