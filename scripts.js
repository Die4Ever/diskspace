
var hddusage;
var quota;
var now;

class Node {
    name;
    fullpath;
    size=0;
    modified=0;
    children = {};
    age=0;
    constructor(fullpath, name, size, modified) {
        this.fullpath = fullpath.replace(config.homedir, '~/');
        this.name = name;
        this.size = parseInt(size);
        this.modified = parseInt(modified);
        this.age = now - this.modified;
    }

    Update() {
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
}

var tree_root = new Node('/', 0, 0);

function FindNode(parent, key) {
    var keys = key.split('/');
    for(var i=0; i<keys.length; i++) {
        var k = keys[i];
        if(!k) { continue; }
        var n = parent.children[k];
        if(!n) {
            n = parent.children[k] = new Node(key, k, 0, 0);
        }
        parent = n;
    }
    return parent;
}

function BuildFilesTree(parent, files) {
    for(var i=0; i<files.length; i++) {
        try {
            var f = files[i];
            var m = f.split('\t');
            var n = FindNode(parent, m[2]);
            n.size = parseInt(m[0]);
            n.modified = parseInt(m[1]);
            n.age = now - n.modified;
        } catch(e) {}
    }

    parent.SortChildren();
}

function round(value, decimalPlaces = 1) {
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
    if(percent>=10) percent = round(percent, 0) + '%';
    else percent = round(percent, 1) + '%';
    return SizeToString(size) + seperator + '('+percent+')';
}

function TimestampToHTML(age) {
    var minutes = 60;
    var hours = minutes * 60;
    var days = hours * 24;
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
    var children='';

    for(var k in node.children) {
        var child = node.children[k];
        if( child.IsRoot() ) continue;
        children += NodeToHTML(child, depth+1);
    }
    //this function is in index.html, I kinda like the idea of putting the html generation in the html file
    return NodeHTML(classes, name_padding_left, node.name, node.fullpath, node.size, size_html, node.modified, modified_html, num_children, children);
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
        if(c.attr('hidden')) c.attr('hidden', null);
        else c.attr('hidden', '');
        return false;
    });

    $('.node.file').click(function(){
        return false;
    });
}

function FilterNodes(parent, filter) {
    var nodes=[];
    var total_size=0;
    var count=0;
    var concat='';
    for(var i in parent.children) {
        if( ! parent.children.hasOwnProperty(i) ) continue;
        var n = parent.children[i];
        if( !n.IsRoot() && filter(n) ) {
            nodes.push(n);
            total_size += n.size;
            count++;
            concat += '"' + n.fullpath +'" ';
        }
    }
    return { nodes: nodes, total_size: total_size, count: count, concat: concat };
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

            var text = c.title + ' (' + SizeToHTML(nodes.total_size) + ' in ' + nodes.count + ' items):\n$ ' + c.command + ' ' + nodes.concat;
            $('.suggested-commands').append($('<p>').text(text));
        } catch (e) { console.error(e); }
    }
}

function update(data) {
    hddusage = parseInt(data.hddusage);
    quota = parseInt(data.quota);
    now = parseInt(data.now);

    BuildFilesTree(tree_root, data.files);
    BuildHTMLTree();
    BuildStats();

    $('.expand-all').click(function(){
        $('.node.folder > .node-children[hidden]').attr('hidden', null);
    });

    $('.expand-most').click(function(){
        $('.disk-space-tree > .node.folder > .node-children[hidden], .disk-space-tree > .node.folder > .node-children > .node.folder > .node-children').attr('hidden', null);
    });

    $('.collapse-all').click(function(){
        $('.node-children:not([hidden])').attr('hidden', '');
    });

    $('.loader').remove();
}

$(function () {

    if (!config) {
        alert('config not found! copy config.example.js to config.js');
    }

    $.ajax({
        url: config.route,
        dataType: "json",
        success: update,
        error: function() {
            alert("OH NO!");
            console.log(arguments);
        }
    });
});


