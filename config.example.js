
var config = {
    route: 'diskspace.php', //alternatively you can use diskspace.py
    display_roots: ['/home/die4ever/'],
    homedir: '/home/die4ever/',
    suggested_commands: [
        { title: 'Suggested for deletion (45+ days)', command: 'rm -rf', filter: function (n) { return n.age >= 86400 * 45; }, folder: '/home/die4ever/' },
        { title: 'Suggested for deletion (40+ days)', command: 'rm -rf', filter: function (n) { return n.age >= 86400 * 40; }, folder: '/home/die4ever/' }
    ],
    stats: function (root, config) {
        var home = FindNode(tree_root, config.homedir);

        var outside_of_home = SizeToHTML(hddusage - home.size);

        return $('<p>').text(
            '\n' + SizeToHTML(hddusage) + " used out of " + SizeToString(quota)
            + '\n' + outside_of_home + ' outside of home'
        );
    }
};
