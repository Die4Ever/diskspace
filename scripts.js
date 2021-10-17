
var hddusage;
var quota;
var now;
var sort_attr;
var sort_asc;
var sort_func=NumericSort;

class Node {
    name;
    fullpath;
    size=0;
    modified=0;
    children = {};
    age=0;
    oldest;
    youngest;

    constructor(fullpath, name, size, modified) {
        this.fullpath = fullpath.replace(config.homedir, '~/');
        this.name = name;
        this.size = parseInt(size);
        this.modified = parseInt(modified) - config.timeoffset;
        this.age = now - this.modified;
    }

    UpdateModified(modified) {
        this.modified = parseInt(modified) - config.timeoffset;
        this.age = now - this.modified;
    }

    RecalcSize() {
        size=0;
    }

    AssertSize() {
        var oldSize = this.size;
        this.RecalcSize();
        console.assert( oldSize === this.size, "size assertion");
    }

    SortChildren() {
        //sort my children and then call SortChildren() on my children
    }

    IsRoot() {
        for(var i=0; i<config.display_roots.length; i++ ) {
            var t = config.display_roots[i].replace(config.homedir, '~/');
            if( t === this.fullpath ) return true;
        }
        return false;
    }

    AddDescendant(child) {
        if( this.youngest === undefined || child.age < this.youngest )
            this.youngest = child.age;
        if( this.oldest === undefined || child.age > this.oldest )
            this.oldest = child.age;

        if( this.parent ) this.parent.AddDescendant(child);
    }

    AddChild(child) {
        this.children[child.name] = child;
        child.parent = this;
        this.AddDescendant(child);
    }

    NumChildren() {
        return Object.getOwnPropertyNames(this.children).length;
    }
}

var tree_root;

function FindNode(parent, key, size, modified) {
    var keys = key.split('/');
    for(var i=0; i<keys.length; i++) {
        var k = keys[i];
        if(!k) { continue; }
        var n = parent.children[k];
        if(!n) {
            n = new Node(key, k, size, modified);
            parent.AddChild(n);
        }
        parent = n;
    }
    return parent;
}

function BuildFilesTree(parent, files) {
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        try {
            var m = f.split('\t');
            var name = m[2];
            var size = parseInt(m[0]);
            var modified = parseInt(m[1]);
            var n = FindNode(parent, name, size, modified);
            //n.size = parseInt(m[0]);
            //n.UpdateModified(parseInt(m[1]));
        } catch (e) { console.error(f, e); }
    }

    parent.SortChildren();
}

function round(value, decimalPlaces = 1) {
    if (value >= 10 && decimalPlaces>0) decimalPlaces--;
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(value * multiplier + Number.EPSILON) / multiplier;
}

function SizeToString(size) {
    var KB = 1024;
    var MB = KB*KB;
    var GB = MB*KB;
    var TB = GB*KB;
    if(size >= TB) return round(size/TB)+'T';
    if(size >= GB) return round(size/GB)+'G';
    if(size >= MB) return round(size/MB)+'M';
    if(size >= KB) return round(size/KB)+'K';
    return size+'B';
}

function SizeToHTML(size, seperator=' ') {
    var percent = size / quota * 100;
    percent = round(percent, 1) + '%';
    return SizeToString(size) + seperator + '('+percent+')';
}

function TimestampToHTML(age) {
    var minutes = 60;
    var hours = minutes * 60;
    var days = hours * 24;
    if (age < 0) age = 0;
    if(age>=days) return round(age/days) + ' days';
    if(age>=hours) return round(age/hours) + ' hours';
    if(age>=minutes) return round(age/minutes) + ' minutes';
    return age + ' seconds';
}

function PathToId(path) {
}

function NodeToHTMLOld(node, depth) {
    //turns out this function is WAY slower than the new one, like 100x slower, using all these jquery functions is expensive compared to just building a string and parsing it all at once
    //usually you wouldn't care about the speed of jquery functions, but it was taking like 3 seconds on my computer
    if(!depth) depth=1;
    var div = $('<div>').addClass('node row');
    if(depth%2) div.addClass('evendepth');
    else div.addClass('odddepth');

    var num_children = Object.keys(node.children).length;
    if(num_children>0) div.addClass('folder');
    else div.addClass('file');

    div.attr('data-size', node.size);
    div.attr('data-modified', node.modified);
    div.attr('id', node.fullpath);

    var name = $('<h4>').addClass('node-name col-lg-8 font-weight-bold').text(node.name);
    name.css({'padding-left': (depth*1.5) +'rem'});
    name.attr('title', node.fullpath);
    div.append(name);

    var size_html = SizeToHTML(node.size, '<br/>');
    div.append($('<span>').addClass('node-size col-lg-1 text-right').html(size_html));
    div.append($('<span>').addClass('node-modified col-lg-1 text-right').html(TimestampToHTML(node.age)));

    div.append($('<span>').addClass('node-num-children col-lg-1 text-right').text(num_children));
    div.append($('<span>').addClass('col-lg-1 text-center').text('...'));
    var children = $('<div>').addClass('node-children col-12').attr('hidden', '');
    for(var k in node.children) {
        var child = node.children[k];
        if( child.IsRoot() ) continue;
        children.append( NodeToHTML(child, depth+1) );
    }
    div.append(children);
    return div;
}

function NodeToHTML(node, depth) {
    if(!depth) depth=1;
    var classes;
    if(depth%2) classes = 'evendepth';
    else classes = 'odddepth';

    var num_children = Object.keys(node.children).length;

    if(num_children>0) classes += ' folder';
    else classes += ' file';

    var name_padding_left = (depth*1.5) +'rem';
    var size_html = SizeToHTML(node.size, '<br/>');
    var modified_html = TimestampToHTML(node.age);
    /*if( node.NumChildren() > 0 ) {
        modified_html = TimestampToHTML(node.youngest);
        modified_html += '<br/>';
        modified_html += TimestampToHTML(node.oldest);
    }*/
    var children='';

    for(var k in node.children) {
        var child = node.children[k];
        if( child.IsRoot() ) continue;
        children += NodeToHTML(child, depth+1);
    }
    //this function is in index.html, I kinda like the idea of putting the html generation in the html file
    return NodeHTML(classes, name_padding_left, node.name, node.fullpath, node.size, size_html, node.modified, modified_html, num_children, children);
}

function NumericSort(a, b) {
    var val_a = $(a).attr(sort_attr);
    var val_b = $(b).attr(sort_attr);
    var res = val_a - val_b;

    if (!sort_asc)
        res *= -1;

    if (res === 0)
        res = $(a).text().localeCompare($(b).text()) *-1;

    return res;
}

function StringSort(a, b) {
    var val_a = $(a).attr(sort_attr);
    var val_b = $(b).attr(sort_attr);
    var res = val_a.localeCompare(val_b);

    if (sort_asc)
        res *= -1;

    if (res === 0)
        res = $(a).text().localeCompare($(b).text()) *-1;

    return res;
}

function SortNodes(node_childrens) {
    node_childrens.each(function () {
        var parent = $(this);
        //should I have a generation counter to see if it needs sorting again? only really matters for the Expand All button...
        var nodes = parent.find('> .node');
        parent.append( nodes.sort(sort_func) );
    });
}

function ChangeSorting() {
    localStorage.setItem("sort_attr", sort_attr);
    localStorage.setItem("sort_asc", sort_asc);
    sort_func = NumericSort;
    if (sort_attr === 'title') sort_func = StringSort;

    var node_childrens = $('.disk-space-tree > .node .node-children:not([hidden])');
    SortNodes(node_childrens);
}

function BuildHTMLTree() {
    $(".disk-space-tree").empty();
    $(".disk-space-tree").append( $('#colheaders-template').text() );

    for(var i=0; i<config.display_roots.length; i++ ) {
        var root = config.display_roots[i];
        var display_root = FindNode(tree_root, root);
        var html = NodeToHTML(display_root);
        $(".disk-space-tree").append(html);
    }

    $('.disk-space-tree > .node').each(function(){
        var size = 0;
        $(this).find('> .node-children > .node').each(function(){
            size += parseInt( $(this).attr('data-size') );
        });
        $(this).attr('data-size', size);
        var size_html = SizeToHTML(size, '<br/>');
        $(this).find('> .node-size').html(size_html);
    });

    $('.node.folder').click(function(){
        var c = $(this).find('> .node-children');
        if (c.attr('hidden')) {
            c.attr('hidden', null);
            SortNodes(c);
        }
        else c.attr('hidden', '');
        return false;
    });

    $('.node.file').click(function(){
        return false;
    });

    $('.colheaders > *[data-sort-attr]').click(function () {
        var attr = $(this).attr('data-sort-attr');
        if (attr === sort_attr) sort_asc = !sort_asc;
        else sort_asc = false;
        sort_attr = attr;
        ChangeSorting();
    });
}

function FilterNodes(parent, filter) {
    var nodes=[];
    var size=0;
    var count=0;
    var concat='';
    for(var i in parent.children) {
        if( ! parent.children.hasOwnProperty(i) ) continue;
        var n = parent.children[i];
        if( !n.IsRoot() && filter(n) ) {
            nodes.push(n);
            size += n.size;
            count++;
            concat += n.fullpath.replace(/^([^\/]\/)/, '$1\'') + '\' ';
        }
    }
    return { nodes: nodes, size: size, count: count, concat: concat };
}

function BuildStats() {
    try {
        $('.stats').html(config.stats(tree_root, config));
    } catch (e) { console.error(e); }

    $('.suggested-commands').empty();
    for (var i = 0; i < config.suggested_commands.length; i++) {
        try {
            var c = config.suggested_commands[i];
            var folder = FindNode(tree_root, c.folder);
            var nodes = FilterNodes(folder, c.filter);

            var text = c.title + ' (' + SizeToHTML(nodes.size) + ' in ' + nodes.count + ' items):\n$ ' + c.command + ' ' + nodes.concat;
            $('.suggested-commands').append($('<p>').text(text));
        } catch (e) { console.error(e); }
    }
}

function update(data) {
    try {
        tree_root = new Node('/', 0, 0);
    } catch (e) {
        console.error(e);
        alert('error building tree root! you probably forgot to make the config');
        return;
    }

    hddusage = parseInt(data.hddusage);
    quota = parseInt(data.quota);
    now = parseInt(data.now);

    BuildFilesTree(tree_root, data.files);
    BuildHTMLTree();
    BuildStats();

    $('.loader').fadeOut('fast');
}

function Refresh() {
    $('.loader').fadeIn('fast');
    $.ajax({
        url: config.route,
        dataType: "json",
        success: update,
        error: function () {
            alert("OH NO!");
            console.log(arguments);
        }
    });
}

$(function () {
    try {
        console.log('using config', config);
    } catch (e) {
        console.error(e);
        alert('config not found! copy config.example.js to config.js');
    }

    try {
        sort_attr = localStorage.getItem('sort_attr');
        sort_asc = localStorage.getItem('sort_asc');
        if (sort_asc === 'true') sort_asc = true;
        if (sort_asc === 'false') sort_asc = false;
    } catch (e) {
        console.error(e);
    }
    if (!sort_attr) {
        sort_attr = 'title';
        sort_asc = false;
    }
    ChangeSorting();

    Refresh();

    if (config.refresh_interval)
        setInterval(Refresh, config.refresh_interval);

    $('.expand-all').click(function () {
        var c = $('.node.folder > .node-children[hidden]');
        c.attr('hidden', null);
        SortNodes(c);
    });

    $('.expand-most').click(function () {
        var c = $('.disk-space-tree > .node.folder > .node-children[hidden], .disk-space-tree > .node.folder > .node-children > .node.folder > .node-children');
        c.attr('hidden', null);
        SortNodes(c);
    });

    $('.collapse-all').click(function () {
        $('.node-children:not([hidden])').attr('hidden', '');
    });

    $('.refresh').click(function () {
        Refresh();
    });

});


