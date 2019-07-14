
var config = {
    route: 'diskspace.php', //alternatively you can use diskspace.py
    display_roots: ['/home/die4ever/'],
    homedir: '/home/die4ever/',
    suggested_commands: [
        { title: 'Suggested for deletion (30+ days)', command: 'rm -rf', filter: function (n) { return n.age >= 86400 * 30; }, folder: '/home/die4ever/downloads/' },
        { title: 'Suggested for deletion (10+ days)', command: 'rm -rf', filter: function (n) { return n.age >= 86400 * 10; }, folder: '/home/die4ever/temp/' }
    ],
    stats: function (root, config) {
        var home = FindNode(root, config.homedir);
        var downloads = FindNode(root, config.homedir+'downloads');

        var outside_of_home = SizeToHTML(hddusage - home.size);
        var outside_of_downloads = SizeToHTML(hddusage - downloads.size);

        return $('<p>').text(
            '\n' + SizeToHTML(hddusage) + " used out of " + SizeToString(quota) + ', ' + SizeToHTML(quota-hddusage) + ' free'
            + '\n' + outside_of_home + ' outside of home'
            + '\n' + outside_of_downloads + ' outside of downloads'
        );
    },
    timeoffset: 0// the du command seems to output local time instead of universal time
};
