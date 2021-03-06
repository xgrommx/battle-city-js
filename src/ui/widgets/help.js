define(['src/lang/lang.js'], function(lang) {
    function WidgetHelp(context, client)
    {
        window.clientServerMessageBus.on('started', function(event){
            var langfile = '/src/edu/' + event.courseName + '/ex' + event.exerciseId;
            $('.lang', context).attr('langfile', langfile);
            $('.content', context).attr('onlang', 'require("src/ui/widgets/help.js").onLang');
            lang.applyLang(null, context);
        });
    };

    WidgetHelp.onLang = function(each)
    {
        $('.code', each).each(function(){
            CodeMirror.runMode($(this).addClass('cm-s-night').text(), "pascal", this);
        });
    };

    return WidgetHelp;
});