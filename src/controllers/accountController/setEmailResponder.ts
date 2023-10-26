import betagouv from "@/betagouv";
import { addEvent, EventCode } from "@/lib/events";
import { requiredError, isValidDate } from "@/controllers/validator";

export async function setEmailResponder(req, res) {
    const formValidationErrors: string[] = [];
    const errorHandler = (field, message) => {
        formValidationErrors[field] = message;
    };
    const { from, to } = req.body;
    const content = req.body.content || requiredError("content", errorHandler);
    const startDate = isValidDate(
        "nouvelle date de debut",
        new Date(from),
        errorHandler
    );
    const endDate = isValidDate(
        "nouvelle date de fin",
        new Date(to),
        errorHandler
    );

    if (startDate && endDate) {
        if (endDate < startDate) {
            formValidationErrors.push(
                "nouvelle date de fin : la date doit être supérieure à la date de début"
            );
        }
    }

    if (formValidationErrors.length) {
        return res.json(
            {
                errors: formValidationErrors,
            },
            {
                status: 400,
            }
        );
    }

    try {
        const responder = await betagouv.getResponder(req.auth.id);
        if (!responder) {
            await betagouv.setResponder(req.auth.id, {
                from: startDate,
                to: endDate,
                content,
            });
            addEvent(EventCode.MEMBER_RESPONDER_CREATED, {
                created_by_username: req.auth.id,
                action_on_username: req.auth.id,
                action_metadata: {
                    value: content,
                },
            });
        } else {
            await betagouv.updateResponder(req.auth.id, {
                from: startDate,
                to: endDate,
                content,
            });
            addEvent(EventCode.MEMBER_RESPONDER_UPDATED, {
                created_by_username: req.auth.id,
                action_on_username: req.auth.id,
                action_metadata: {
                    value: content,
                    old_value: responder.content,
                },
            });
        }
    } catch (err) {
        console.error(err);
        return res.json(
            {
                message: err.message,
            },
            {
                status: 500,
            }
        );
    }
    return res.json({
        message: "Done",
    });
}
