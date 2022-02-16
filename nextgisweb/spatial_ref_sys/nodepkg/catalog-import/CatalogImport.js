import { Button, Form, message } from "@nextgisweb/gui/antd";
import { ImportOutlined } from "@ant-design/icons";

import { route } from "@nextgisweb/pyramid/api";
import { FieldsForm } from "@nextgisweb/gui/fields-form";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import i18n from "@nextgisweb/pyramid/i18n!";
import ErrorDialog from "ngw-pyramid/ErrorDialog/ErrorDialog";
import { useEffect, useState } from "react";

export function CatalogImport({ url, id }) {
    const [status, setStatus] = useState("loading");
    const [data, setData] = useState(null);

    const [fields] = useState([
        {
            name: "display_name",
            label: i18n.gettext("Display name"),
            readOnly: true,
        },
        {
            name: "wkt",
            label: i18n.gettext("OGC WKT definition"),
            readOnly: true,
            widget: "textarea",
            rows: 4,
            style: { margin: "0" },
        },
    ]);

    useEffect(async () => {
        // route('spatial_ref_sys.catalog.import')
        try {
            const srs = await route("spatial_ref_sys.catalog.item", id).get();
            setData(srs);
            setStatus(null);
        } catch (err) {
            new ErrorDialog(err).show();
            setStatus("error");
        }
    }, []);

    if (status === "loading") {
        return <LoadingWrapper />;
    } else if (status === "error") {
        return null;
    }

    const showSrsDetailInfo = () => {
        window.open(url, "_blank");
    };

    const importSrs = async () => {
        setStatus("importing");
        try {
            await route("spatial_ref_sys.catalog.import").post({
                json: { catalog_id: id },
            });
            message.success(
                i18n.gettext("The spatial reference system is imported")
            );
        } catch (err) {
            new ErrorDialog(err).show();
        } finally {
            setStatus(null);
        }
    };

    return (
        <FieldsForm fields={fields} initialValues={data}>
            <Form.Item>
                <Button
                    onClick={showSrsDetailInfo}
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                >
                    {i18n.gettext("View details")}
                </Button>
            </Form.Item>
            <Form.Item>
                <SaveButton
                    onClick={importSrs}
                    loading={status === "importing"}
                    icon={<ImportOutlined />}
                >
                    {i18n.gettext("Import")}
                </SaveButton>
            </Form.Item>
        </FieldsForm>
    );
}