<?xml version="1.0" encoding="UTF-8"?>
<!-- Shows /sitemap.xml as a readable table when it is opened in a browser -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:page="https://eduboard-798471611335.us-central1.run.app/schemas/page-functions">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Sitemap – Educational Board Games</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #141414; background: #fff; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          p.lead { margin: 0 0 16px; color: #555; font-size: 14px; }
          table { border-collapse: collapse; width: 100%; font-size: 13px; }
          th, td { border: 1px solid #141414; padding: 6px 8px; vertical-align: top; text-align: left; }
          th { background: #141414; color: #fff; }
          tr.sub td { background: #f4f4f4; }
          tr.sub td.path { padding-left: 24px; }
          ul { margin: 0; padding-left: 18px; }
          a { color: #1a4fd6; }
          .tag { display: inline-block; border: 1px solid #141414; padding: 0 4px; margin: 1px 0; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>Sitemap – Educational Board Games OS</h1>
        <p class="lead"><xsl:value-of select="count(s:urlset/s:url)"/> public addresses and <xsl:value-of select="count(//page:subpage)"/> per-session pages. Every function of each page is listed.</p>
        <table>
          <tr><th>Address</th><th>Page</th><th>Type / access</th><th>Functions</th><th>UI / FR</th><th>Priority</th></tr>
          <xsl:for-each select="s:urlset/s:url">
            <tr>
              <td class="path"><a href="{s:loc}"><xsl:value-of select="substring-after(substring-after(s:loc, '//'), '/')"/><xsl:if test="substring-after(substring-after(s:loc, '//'), '/') = ''">/ (home)</xsl:if></a></td>
              <td><b><xsl:value-of select="page:info/page:name"/></b></td>
              <td><xsl:value-of select="page:info/page:type"/><br/><small><xsl:value-of select="page:info/page:access"/></small></td>
              <td><ul><xsl:for-each select="page:info/page:function"><li><xsl:value-of select="."/></li></xsl:for-each></ul></td>
              <td><xsl:if test="normalize-space(page:info/page:ui)"><span class="tag"><xsl:value-of select="page:info/page:ui"/></span><br/></xsl:if><xsl:if test="normalize-space(page:info/page:fr)"><span class="tag"><xsl:value-of select="page:info/page:fr"/></span></xsl:if></td>
              <td><xsl:value-of select="s:priority"/></td>
            </tr>
            <xsl:for-each select="page:info/page:subpage">
              <tr class="sub">
                <td class="path">↳ <xsl:value-of select="@path"/></td>
                <td><b><xsl:value-of select="page:name"/></b></td>
                <td><xsl:value-of select="page:type"/><br/><small>opened from Saved Sessions</small></td>
                <td><ul><xsl:for-each select="page:function"><li><xsl:value-of select="."/></li></xsl:for-each></ul></td>
                <td><span class="tag"><xsl:value-of select="page:ui"/></span><br/><span class="tag"><xsl:value-of select="page:fr"/></span></td>
                <td>–</td>
              </tr>
            </xsl:for-each>
          </xsl:for-each>
          <tr class="sub">
            <td class="path">(every page)</td><td><b>Navigation bar and taskbar</b></td><td>Shared</td>
            <td><ul><xsl:for-each select="s:urlset/s:url/page:everyPage/page:function"><li><xsl:value-of select="."/></li></xsl:for-each></ul></td><td></td><td>–</td>
          </tr>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
