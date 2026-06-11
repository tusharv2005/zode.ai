---
sidebar_label: Alibaba Cloud
---

# Using Alibaba Cloud With Zode Code

Zode Code supports Alibaba Cloud Model Studio (DashScope) through the native Alibaba AI SDK provider. Use it to run Qwen and other DashScope-hosted models directly from Zode.

**Website:** [https://www.alibabacloud.com/product/modelstudio](https://www.alibabacloud.com/product/modelstudio)

## Getting an API Key

1. Sign in to Alibaba Cloud Model Studio or DashScope.
2. Open the API key section for your workspace.
3. Create a key and copy it immediately.
4. Store the key securely; do not commit it to your repository.

## Configuration in Zode Code

{% tabs %}
{% tab label="VSCode (Legacy)" %}

Use the **OpenAI Compatible** provider if the legacy provider list does not include Alibaba Cloud. Set the base URL and API key from your DashScope account, then choose or enter a supported model ID.

{% /tab %}
{% tab label="VSCode" %}

Open **Settings** (gear icon) and go to the **Providers** tab to add Alibaba Cloud. Enter your DashScope API key and choose a supported model from the model picker.

The extension stores this in your `zode.json` config file. You can also edit the config file directly — see the **CLI** tab for the file format.

{% /tab %}
{% tab label="CLI" %}

Set the DashScope API key as an environment variable or configure it in your `zode.json` config file:

**Environment variable:**

```bash
export DASHSCOPE_API_KEY="your-api-key"
```

**Config file** (`~/.config/zode/zode.json` or `./zode.json`):

```jsonc
{
  "provider": {
    "alibaba": {
      "env": ["DASHSCOPE_API_KEY"]
    }
  }
}
```

Then set your default model:

```jsonc
{
  "model": "alibaba/qwen-plus"
}
```

Some regions and model catalogs may expose Alibaba models under `alibaba-cn` instead. In that case, use the same API key and set the model as `alibaba-cn/<model-id>`.

{% /tab %}
{% /tabs %}

## Tips and Notes

- **Native provider:** Zode uses the native Alibaba AI SDK provider, not a generic compatibility shim, when you select the built-in Alibaba provider.
- **Cache controls:** Zode forwards provider cache controls for compatible Alibaba/DashScope models, which can reduce repeated context cost where the model supports caching.
- **Regional catalogs:** Model availability varies by account, region, and gateway. Check the DashScope console for the exact model IDs available to your account.
- **Pricing and limits:** Refer to Alibaba Cloud Model Studio pricing and rate-limit documentation for current usage details.

## Troubleshooting

- **Authentication errors:** Verify `DASHSCOPE_API_KEY` is set in the same shell that launches Zode, or stored in your Zode provider config.
- **Model not found:** Confirm the model ID is available in your DashScope account and try the model picker to see Zode's current catalog.
- **Region mismatch:** If your account uses the China-region catalog, try the `alibaba-cn/<model-id>` provider prefix.
