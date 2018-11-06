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

function draw_const_map(config) {

    var width = config.width || 600
    var height = config.height || 360
    var placeholder = config.placeholder


    var padding_x = config.padding_x || 11
    var padding_y = config.padding_y || 12

    var map_obj = config.map_obj

    var circle_padding = ((width/100)*(height/100))/1.5

    var const_radius = ((width/100)*(height/100))/4

    var svg = d3.select(placeholder).append("svg")
        .attr("width", width)
        .attr("height", height);


    var parties = _.uniq(elec_results.map(function (d) {
        return d.party;
    }))

    var feature = topojson.feature(map_obj, _.values(map_obj.objects)[0]);
    var const_dims = {}
    var j = 0
    _.forEach(parties, function (party) {
        var i = 0
        _.each(feature.features, function (d) {
            ac_name = d.properties.AC_NAME
            if (filter_obj(elec_results, 'constituency', ac_name)[0].party === party) {
                curr_x = (i * circle_padding) + padding_x
                if (curr_x >= (width-15)) {
                    i = 0
                    curr_x = (i * circle_padding) + padding_x
                    j += 1
                }
                curr_y = (j * circle_padding) + padding_y
                const_dims[ac_name] = { x: curr_x, y: curr_y }
                i++
            }
        })
        j++
    })



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

    var inward = feature.features.map(function (d) {
        const_dim = const_dims[d.properties.AC_NAME]
        return flubber.combine(flubber.splitPathString(geoPath(d)),
            circlePath(const_dim.x, const_dim.y, const_radius),
            { single: true });
    });

    var outward = feature.features.map(function (d) {
        const_dim = const_dims[d.properties.AC_NAME]
        return flubber.separate(circlePath(const_dim.x, const_dim.y, const_radius),
            flubber.splitPathString(geoPath(d)),
            { single: true });
    });


    d3.select("#show_circles").on("click", function () {
        path
            .transition().delay(500).duration(5000)
            .attrTween("d", function (d, i) {
                return inward[i];
            })

    })
    d3.select("#show_map").on("click", function () {
        path
            .transition().delay(500).duration(5000)
            .attrTween("d", function (d, i) {
                return outward[i];
            })
    })

}

var config = {} 
config.map_obj = map_obj
config.placeholder = '#map'

draw_const_map(config)
