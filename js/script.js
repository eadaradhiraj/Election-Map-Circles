

function circlePath(x, y, radius) {
    var l = x - radius + "," + y,
        r = x + radius + "," + y,
        pre = "A" + radius + "," + radius + ",0,1,1";
    return "M" + l + pre + "," + r + pre + "," + l + "Z";
}

function filter_obj(obj_arr, key, value) {
    return obj_arr.filter(function (res) {
        return res[key] === value
    });
}

function draw_const_map(config) {

    var const_dims = {}

    var width = config.width || 900
    var height = config.height || 540
    var placeholder = config.placeholder


    var padding_x = config.padding_x || 11
    var padding_y = config.padding_y || 13

    var map_obj = config.map_obj

    var circle_padding = ((width / 100) * (height / 100)) / 1.5

    var const_radius = ((width / 100) * (height / 100)) / 4

    var svg = d3.select(placeholder).append("svg")
        .attr("width", width)
        .attr("height", height);

    var counts = {}
    elec_results.forEach(function (d) {
        counts[d.party] = 1 + (counts[d.party] || 0)
    })
    var parties = Object.keys(counts).sort(function (a, b) {
        return counts[b] - counts[a]
    })


    var feature = topojson.feature(map_obj, d3.values(map_obj.objects)[0]);
    var j = 0
    var i = 0
    parties.forEach(function (party) {
        feature["features"].forEach(function (d) {
            ac_no = d.properties.AC_NO
            ac_name = d.properties.AC_NAME
            if (filter_obj(elec_results, 'constituency', ac_name)[0].party === party) {
                curr_x = (i * circle_padding) + padding_x
                if (curr_x >= (width - 15)) {
                    i = 0
                    curr_x = (i * circle_padding) + padding_x
                    j += 1
                }
                curr_y = (j * circle_padding) + padding_y
                const_dims[ac_no] = {
                    x: curr_x,
                    y: curr_y
                }
                i++
            }
        })
    })



    var proj = d3.geoEquirectangular()
        .fitSize([width, height], feature);
    var geoPath = d3.geoPath().projection(proj);

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "50px")
        .style("height", "50px")
        .style("padding", "2px")
        .style("font-size", "12px")
        .style("font-style", "sans-serif")
        .style("background", "yellow")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")

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
        })
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(filter_obj(elec_results, 'constituency', d.properties.AC_NAME)[0].party + "<br/>" + d.properties.AC_NAME)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    var inward = {}
    var outward = {}
    feature.features.forEach(function (d) {
        const_dim = const_dims[d.properties.AC_NO]
        inward[d.properties.AC_NO] = flubber.combine(flubber.splitPathString(geoPath(d)),
            circlePath(const_dim.x, const_dim.y, const_radius), {
                single: true
            });
        // outward[d.properties.AC_NO] = flubber.separate(circlePath(const_dim.x, const_dim.y, const_radius),
        //     flubber.splitPathString(geoPath(d)), {
        //         single: true
        //     });
    })


    d3.select("#show_circles").on("click", function () {
        path
            .transition().delay(500).duration(5000)
            .attrTween("d", function (d) {
                return inward[d.properties.AC_NO];
            })

    })
    d3.select("#show_map").on("click", function () {
        delay = 2000
        
        path
            .transition().duration(delay).attr("d", function (d) {
                cd = const_dims[d.properties.AC_NO]
                // console.log(cd)
                new_path = circlePath(cd.x+20, cd.y+20, 4)
                outward[d.properties.AC_NO] = flubber.separate(new_path,
                flubber.splitPathString(geoPath(d)), {
                    single: true
                });
                return new_path
            })
        path
            .transition().delay(delay+1000).duration(5000)
            .attrTween("d", function (d, i) {
                return outward[d.properties.AC_NO];
            })
    })

}

var config = {}
config.map_obj = map_obj
config.placeholder = '#map'

draw_const_map(config)