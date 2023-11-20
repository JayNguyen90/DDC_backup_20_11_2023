<!DOCTYPE HTML>
<html>
  <head>
<#list config.stylesheetUrls as url>
    <link rel="stylesheet" href="${url}" />
</#list>
<#list config.scriptUrls as url>
    <script type="text/javascript" src="${url}"></script>
</#list>
  </head>

  <body>
    <div id="items"></div>
  </body>
</html>