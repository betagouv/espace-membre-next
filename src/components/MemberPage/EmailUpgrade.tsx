import { useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

import { safeUpgradeEmailForUser } from "@/app/api/member/actions/upgradeEmailForUser";
import { memberBaseInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

export const EmailUpgrade = ({
    availableEmailPros,
    userInfos,
}: {
    userInfos: memberBaseInfoSchemaType;
    availableEmailPros: string[];
}) => {
    const [password, setPassword] = useState<string>();
    const onSubmit = async () => {
        // todo: refactor with actions
        if (!password) {
            return;
        }
        const resp = await safeUpgradeEmailForUser({
            username: userInfos.username,
            password,
        });
        if (resp.success) {
            alert(`Le compte sera upgradé d'ici quelques minutes`);
        } else {
            console.error(resp.message);
            alert("Une erreur est survenue");
        }
    };
    return (
        <>
            <p>Il y a {availableEmailPros.length} comptes disponibles.</p>
            <p>Passer ce compte en pro : </p>
            <div
                className="no-margin"
                onSubmit={(e) => {
                    e.preventDefault();
                }}
            >
                <Input
                    label={`Un mot de passe pour ce compte`}
                    nativeInputProps={{
                        name: "password",
                        type: "password",
                        required: true,
                        min: 14,
                        onChange: (e) => {
                            setPassword(e.target.value);
                        },
                    }}
                />
                <Button onClick={onSubmit}>Upgrader en compte pro</Button>
            </div>
            <br />
            <br />
        </>
    );
};
